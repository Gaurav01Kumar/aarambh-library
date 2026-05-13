import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const studentId = searchParams.get('studentId') || '';
    const date = searchParams.get('date') || '';

    const query: any = {};

    if (studentId) {
      query.student = studentId;
    }

    if (date) {
      query.date = new Date(date);
    }

    const skip = (page - 1) * limit;
    const attendance = await Attendance.find(query)
      .populate('student')
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const attendance = await Attendance.create(body);

    return NextResponse.json({
      success: true,
      data: attendance,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create attendance'
      },
      { status: 500 }
    );
  }
}