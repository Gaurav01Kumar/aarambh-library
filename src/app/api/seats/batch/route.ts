import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Seat from '@/lib/models/Seat';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { seats } = body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid seats data' },
        { status: 400 }
      );
    }

    // Check for duplicate seat numbers
    const seatNumbers = seats.map(s => s.seatNumber);
    const existingSeats = await Seat.find({ seatNumber: { $in: seatNumbers } });
    const existingNumbers = existingSeats.map(s => s.seatNumber);

    if (existingNumbers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Seat numbers already exist: ${existingNumbers.join(', ')}`
        },
        { status: 409 }
      );
    }

    // Create all seats
    const createdSeats = await Seat.insertMany(seats);

    return NextResponse.json({
      success: true,
      data: createdSeats,
      message: `Successfully created ${createdSeats.length} seats`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating seats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create seats'
      },
      { status: 500 }
    );
  }
}
