import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Seat from '@/lib/models/Seat';
import Student from '@/lib/models/Student'; // Note: This will use LibraryMember under the hood

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
        seatObj.currentStudents = studentsForSeat.map((student: any) => ({
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          feeStatus: student.feeStatus,
          feeDueDate: student.feeDueDate,
          isActive: student.isActive,
          subscriptionPlan: student.subscriptionPlan,
          subscriptionExpiry: student.subscriptionExpiry,
          startTime: student.startTime,
          endTime: student.endTime,
        }));
      } else {
        seatObj.currentStudents = [];
        seatObj.isOccupied = false;
      }
      return seatObj;
    });

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