import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    student.registeredDeviceId = null;
    await student.save();

    return NextResponse.json({ success: true, message: 'Device reset successfully' });
  } catch (error) {
    console.error('Error resetting device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset device' },
      { status: 500 }
    );
  }
}
