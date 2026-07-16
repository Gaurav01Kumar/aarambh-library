import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Seat from '@/lib/models/Seat';
import Student from '@/lib/models/Student';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const seat = await Seat.findById(params.id);
    
    if (!seat) {
      return NextResponse.json({ success: false, error: 'Seat not found' }, { status: 404 });
    }
    
    // Remove this seat assignment from all students assigned to it
    await Student.updateMany(
      { seatNumber: seat.seatNumber },
      { $set: { seatNumber: '' } }
    );
    
    // Also reset seat status manually just in case
    seat.isOccupied = false;
    await seat.save();
    
    return NextResponse.json({ success: true, message: 'Seat emptied successfully' });
  } catch (error: any) {
    console.error('Error emptying seat:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
