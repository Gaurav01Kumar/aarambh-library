import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = await params;

    const record = await Attendance.findById(id);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    // Also remove from the student's embedded array if it exists
    if (record.student && record.status === 'success') {
      const student = await Student.findById(record.student);
      if (student && student.attendance) {
        // We match by date (ignoring time) to remove the embedded array item
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        
        student.attendance = student.attendance.filter((att: any) => {
          const attDate = new Date(att.date);
          attDate.setHours(0, 0, 0, 0);
          return attDate.getTime() !== recordDate.getTime();
        });
        await student.save();
      }
    }

    await Attendance.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
