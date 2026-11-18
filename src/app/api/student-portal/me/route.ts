import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
import Organization from '@/lib/models/Organization';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email')?.trim().toLowerCase();
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Email or Student ID is required' },
        { status: 400 }
      );
    }

    const query = id ? { _id: id } : { email };
    const student = await Student.findOne(query).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Fetch recent attendance logs specifically for this student
    let recentAttendance: any[] = [];
    try {
      const logs = await Attendance.find({ student: student._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(15);
      
      if (logs.length > 0) {
        recentAttendance = logs;
      } else if (student.attendance && student.attendance.length > 0) {
        // Fallback to embedded attendance array
        recentAttendance = student.attendance
          .slice()
          .sort((a: any, b: any) => new Date(b.date || b.checkIn).getTime() - new Date(a.date || a.checkIn).getTime())
          .slice(0, 15);
      }
    } catch (e) {
      console.error('Error fetching student attendance logs:', e);
      if (student.attendance) {
        recentAttendance = student.attendance.slice(-15).reverse();
      }
    }

    // Get Library info
    let org = await Organization.findOne();
    const libraryInfo = {
      name: org?.name || 'Aarambh Library',
      phone: org?.phone || '+91 9876543210',
      email: org?.email || 'info@aarambhlibrary.com',
      address: org?.address || 'Main Road, Study Hub',
      checkInTime: org?.settings?.checkInTime || '08:00',
      checkOutTime: org?.settings?.checkOutTime || '22:00',
    };

    // Check 1st-of-month fee rule for accurate paid/unpaid gate
    const now = new Date();
    const currentYM = now.getFullYear() * 12 + now.getMonth();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    let effectiveFeeStatus = student.feeStatus || 'unpaid';

    try {
      const sPayments = await Payment.find({
        studentId: student._id,
        status: { $in: ['completed', 'partial'] },
        isFake: { $ne: true },
      }).sort({ date: -1, createdAt: -1 });

      if (sPayments.length > 0) {
        const hasCompletedForMonth = sPayments.some((p: any) => {
          if (p.status !== 'completed') return false;
          const pDate = new Date(p.date || p.createdAt);
          const pYM = pDate.getFullYear() * 12 + pDate.getMonth();
          const monthsCovered = Math.max(1, Number(p.months || 1));
          return currentYM >= pYM && currentYM < pYM + monthsCovered;
        });
        if (hasCompletedForMonth) {
          effectiveFeeStatus = 'paid';
        } else {
          const hasPartial = sPayments.some((p: any) => {
            if (p.status !== 'partial') return false;
            const pDate = new Date(p.date || p.createdAt);
            return pDate.getFullYear() === now.getFullYear() && pDate.getMonth() === now.getMonth();
          });
          effectiveFeeStatus = hasPartial ? 'partial' : 'unpaid';
          if (student.feeStatus === 'paid') {
            student.feeStatus = effectiveFeeStatus;
            await student.save();
          }
        }
      } else if (
        student.feeStatus === 'paid' &&
        student.feeDueDate &&
        new Date(student.feeDueDate) <= startOfCurrentMonth
      ) {
        effectiveFeeStatus = 'unpaid';
        student.feeStatus = 'unpaid';
        await student.save();
      }
    } catch (e) {
      console.error('Error verifying monthly fee status:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          seatNumber: student.seatNumber || 'Unassigned (Contact Admin)',
          qrCode: student.qrCode,
          startTime: student.startTime || '08:00',
          endTime: student.endTime || '20:00',
          selectedShifts: student.selectedShifts || [],
          feeStatus: effectiveFeeStatus,
          feeAmount: student.feeAmount || 0,
          feeDueDate: student.feeDueDate,
          subscriptionPlan: student.subscriptionPlan || 'basic',
          subscriptionExpiry: student.subscriptionExpiry,
          targetExam: student.targetExam || '',
          studyStage: student.studyStage || '',
          examTargets: student.examTargets || [],
          joinDate: student.joinDate,
          isActive: student.isActive,
        },
        attendance: recentAttendance,
        library: libraryInfo,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/student-portal/me:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch student data' },
      { status: 500 }
    );
  }
}
