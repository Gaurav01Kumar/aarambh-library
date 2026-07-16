import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Seat from '@/lib/models/Seat';
import Student from '@/lib/models/Student';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const seat = await Seat.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!seat) {
      return NextResponse.json({ success: false, error: 'Seat not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: seat });
  } catch (error: any) {
    console.error('Error updating seat:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const seat = await Seat.findByIdAndDelete(params.id);
    
    if (!seat) {
      return NextResponse.json({ success: false, error: 'Seat not found' }, { status: 404 });
    }
    
    // Also remove this seat assignment from all students
    await Student.updateMany(
      { seatNumber: seat.seatNumber },
      { $set: { seatNumber: '' } }
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting seat:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
