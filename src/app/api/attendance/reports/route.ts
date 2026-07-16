import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Student from '@/lib/models/Student';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'daily'; // daily, monthly, student
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    
    let query: any = {};
    
    if (studentId) {
      query.student = studentId;
    }

    if (filter === 'daily') {
      const today = date ? new Date(date) : new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.createdAt = {
        $gte: today,
        $lt: tomorrow
      };
    } else if (filter === 'monthly') {
      const today = date ? new Date(date) : new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      
      query.createdAt = {
        $gte: firstDay,
        $lt: lastDay
      };
    }

    const records = await Attendance.find(query)
      .populate({ path: 'student', select: 'name seatNumber feeStatus' })
      .sort({ createdAt: -1 })
      .limit(1000);

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}
