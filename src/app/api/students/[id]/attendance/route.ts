import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    const attendance = await Attendance.find({ student: studentId })
      .sort({ date: -1 })
      .limit(30);

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error: any) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
