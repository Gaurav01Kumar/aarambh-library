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
    const seats = await Seat.find(query).sort({ seatNumber: 1 });

    // If timing is provided, calculate occupancy based on overlapping student shifts
    if (startTime && endTime) {
      // Find all students who are active and have overlapping shifts
      // Overlap: (s.startTime < request.endTime) AND (s.endTime > request.startTime)
      const overlappingStudents = await Student.find({
        isActive: true,
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      }).select('seatNumber startTime endTime');

      const occupiedSeatNumbers = new Set(overlappingStudents.map(s => s.seatNumber));

      const processedSeats = seats.map(seat => {
        const isActuallyOccupied = occupiedSeatNumbers.has(seat.seatNumber);
        return {
          ...seat.toObject(),
          isOccupied: isActuallyOccupied || seat.isOccupied // Use either hardcoded or dynamic status
        };
      });

      return NextResponse.json({
        success: true,
        data: processedSeats,
      });
    }

    return NextResponse.json({
      success: true,
      data: seats,
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