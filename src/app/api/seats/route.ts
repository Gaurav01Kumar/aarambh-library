import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Seat from '@/lib/models/Seat';
import Student from '@/lib/models/Student'; // Note: This will use LibraryMember under the hood
import Attendance from '@/lib/models/Attendance';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '500'); // Larger limit for map view
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    const query: any = {};
    
    // Fetch all seats
    let seats = await Seat.find(query)
      .sort({ seatNumber: 1 });

    // Fetch all active students to dynamically assign them to seats
    // (fixes inconsistency where Student has seatNumber but Seat document is not updated)
    const activeStudents = await Student.find({ isActive: true });
    
    // Fetch today's successful attendance logs
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let todayAttendanceLogs: any[] = [];
    try {
      todayAttendanceLogs = await Attendance.find({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: 'success'
      });
    } catch (e) {
      console.error('Error fetching today attendance logs:', e);
    }
    const attendedStudentIds = new Set(todayAttendanceLogs.map(log => log.student.toString()));

    // Monthly fee rule:
    // On the 1st of every month, mark a student as unpaid if they haven't paid for the current month.
    // After the 10th of the month, any unpaid student is considered overdue.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYM = currentYear * 12 + currentMonth;
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const isAfter10th = now.getDate() > 10;

    let allPayments: any[] = [];
    try {
      allPayments = await Payment.find({
        status: { $in: ['completed', 'partial'] },
        isFake: { $ne: true },
      }).sort({ date: -1, createdAt: -1 });
    } catch (e) {
      console.error('Error fetching payments for seat status:', e);
    }

    const paymentsByStudent = new Map<string, any[]>();
    allPayments.forEach((p) => {
      const sid = p.studentId?.toString();
      if (!sid) return;
      if (!paymentsByStudent.has(sid)) {
        paymentsByStudent.set(sid, []);
      }
      paymentsByStudent.get(sid)!.push(p);
    });

    const stalePaidStudentIds: any[] = [];

    const studentPaymentMeta = new Map<string, {
      effectiveFeeStatus: 'paid' | 'unpaid' | 'partial';
      paidForCurrentMonth: boolean;
      isOverdue: boolean;
      lastPaymentDate: string | null;
    }>();

    activeStudents.forEach((student: any) => {
      const sid = student._id.toString();
      const sPayments = paymentsByStudent.get(sid) || [];
      const latestPayment = sPayments[0] || null;

      // Check if any completed payment covers the current calendar month
      const hasCompletedPaymentForCurrentMonth = sPayments.some((p) => {
        if (p.status !== 'completed') return false;
        const pDate = new Date(p.date || p.createdAt);
        const pYM = pDate.getFullYear() * 12 + pDate.getMonth();
        const monthsCovered = Math.max(1, Number(p.months || 1));
        return currentYM >= pYM && currentYM < pYM + monthsCovered;
      });

      const hasPartialPaymentThisMonth = sPayments.some((p) => {
        if (p.status !== 'partial') return false;
        const pDate = new Date(p.date || p.createdAt);
        return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
      });

      let effectiveFeeStatus: 'paid' | 'unpaid' | 'partial' = student.feeStatus || 'unpaid';
      let paidForCurrentMonth = hasCompletedPaymentForCurrentMonth;

      if (hasCompletedPaymentForCurrentMonth) {
        effectiveFeeStatus = 'paid';
      } else if (hasPartialPaymentThisMonth) {
        effectiveFeeStatus = 'partial';
        paidForCurrentMonth = false;
      } else if (sPayments.length > 0) {
        // Student has payment history, but none covering the current month -> unpaid on 1st of month
        effectiveFeeStatus = 'unpaid';
        paidForCurrentMonth = false;
        if (student.feeStatus === 'paid') {
          stalePaidStudentIds.push(student._id);
        }
      } else {
        // No payment history yet: check feeDueDate vs 1st of current month
        const dueBeforeOrOnMonthStart = student.feeDueDate
          ? new Date(student.feeDueDate) <= startOfCurrentMonth
          : true;
        if (student.feeStatus === 'paid' && !dueBeforeOrOnMonthStart) {
          paidForCurrentMonth = true;
          effectiveFeeStatus = 'paid';
        } else {
          effectiveFeeStatus = student.feeStatus === 'partial' ? 'partial' : 'unpaid';
          paidForCurrentMonth = false;
          if (student.feeStatus === 'paid') {
            stalePaidStudentIds.push(student._id);
          }
        }
      }

      const isOverdue = !paidForCurrentMonth && (
        isAfter10th ||
        (student.feeDueDate ? new Date(student.feeDueDate) < startOfCurrentMonth : false)
      );

      studentPaymentMeta.set(sid, {
        effectiveFeeStatus,
        paidForCurrentMonth,
        isOverdue,
        lastPaymentDate: latestPayment ? (latestPayment.date || latestPayment.createdAt) : null,
      });
    });

    // Persist 1st-of-month unpaid reset to DB so dashboard & other pages stay in sync
    if (stalePaidStudentIds.length > 0) {
      try {
        await Student.updateMany(
          { _id: { $in: stalePaidStudentIds } },
          { $set: { feeStatus: 'unpaid' } }
        );
      } catch (e) {
        console.error('Error syncing 1st-of-month unpaid status:', e);
      }
    }

    const studentBySeat = new Map();
    activeStudents.forEach(student => {
      if (student.seatNumber) {
        if (!studentBySeat.has(student.seatNumber)) {
          studentBySeat.set(student.seatNumber, []);
        }
        studentBySeat.get(student.seatNumber).push(student);
      }
    });

    let processedSeats = seats.map(seat => {
      const seatObj = seat.toObject();
      const studentsForSeat = studentBySeat.get(seatObj.seatNumber) || [];
      
      if (studentsForSeat.length > 0) {
        seatObj.isOccupied = true; // Overall occupied status if anyone sits here
        seatObj.currentStudents = studentsForSeat.map((student: any) => {
          const attendanceList = student.attendance ? [...student.attendance] : [];
          
          // Check if student has attendance in Attendance collection for today
          const hasAttendedTodayLog = attendedStudentIds.has(student._id.toString());
          const hasAttendedTodayInDoc = attendanceList.some((a: any) => {
            const d = new Date(a.date || a.checkIn);
            return d >= startOfToday && d <= endOfToday;
          });

          if (hasAttendedTodayLog && !hasAttendedTodayInDoc) {
            const log = todayAttendanceLogs.find(l => l.student.toString() === student._id.toString());
            attendanceList.push({
              date: log?.date || new Date(),
              checkIn: log?.checkIn || new Date(),
              checkOut: log?.checkOut,
            });
          }

          const payMeta = studentPaymentMeta.get(student._id.toString());

          return {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            feeStatus: payMeta?.effectiveFeeStatus || student.feeStatus,
            paidForCurrentMonth: payMeta?.paidForCurrentMonth ?? false,
            isOverdue: payMeta?.isOverdue ?? false,
            lastPaymentDate: payMeta?.lastPaymentDate ?? null,
            feeDueDate: student.feeDueDate,
            isActive: student.isActive,
            subscriptionPlan: student.subscriptionPlan,
            subscriptionExpiry: student.subscriptionExpiry,
            startTime: student.startTime,
            endTime: student.endTime,
            attendance: attendanceList,
          };
        });
      } else {
        seatObj.currentStudents = [];
        seatObj.isOccupied = false;
      }
      return seatObj;
    });

    // Natural numeric sorting (1, 2, 3, ... 10, 11, S-1, S-2, S-10, etc.)
    processedSeats.sort((a, b) => 
      a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' })
    );

    // If timing is provided, calculate occupancy based on overlapping student shifts
    if (startTime && endTime) {
      // Find all students who are active and have overlapping shifts
      // We convert time to minutes from midnight to handle overnight logic
      const startH = parseInt(startTime.split(':')[0]);
      const startM = parseInt(startTime.split(':')[1]);
      const endH = parseInt(endTime.split(':')[0]);
      const endM = parseInt(endTime.split(':')[1]);
      
      const requestedStart = startH * 60 + startM;
      let requestedEnd = endH * 60 + endM;
      if (requestedEnd <= requestedStart) requestedEnd += 1440; // overnight
      
      const occupiedSeatNumbers = new Set();
      
      activeStudents.forEach(student => {
        if (!student.startTime || !student.endTime || !student.seatNumber) return;
        
        const sStartH = parseInt(student.startTime.split(':')[0]);
        const sStartM = parseInt(student.startTime.split(':')[1]);
        const sEndH = parseInt(student.endTime.split(':')[0]);
        const sEndM = parseInt(student.endTime.split(':')[1]);
        
        const sStart = sStartH * 60 + sStartM;
        let sEnd = sEndH * 60 + sEndM;
        if (sEnd <= sStart) sEnd += 1440; // overnight

        // Check for overlap: Overlap happens when max(start1, start2) < min(end1, end2)
        // With a 1-minute buffer to allow back-to-back shifts (e.g. 8-10 and 10-12)
        if (Math.max(requestedStart, sStart) < Math.min(requestedEnd, sEnd)) {
          occupiedSeatNumbers.add(student.seatNumber);
        }
      });

      processedSeats = processedSeats.map(seatObj => {
        const isActuallyOccupied = occupiedSeatNumbers.has(seatObj.seatNumber);
        return {
          ...seatObj,
          isOccupied: isActuallyOccupied // Strictly override for registration mapping
        };
      });

      return NextResponse.json({
        success: true,
        data: processedSeats,
      });
    }

    return NextResponse.json({
      success: true,
      data: processedSeats,
    });
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch seats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const seat = await Seat.create(body);
    return NextResponse.json({ success: true, data: seat }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating seat:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}