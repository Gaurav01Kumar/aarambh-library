import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FeeReminder from '@/lib/models/FeeReminder';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (studentId) {
      query.student = studentId;
    }

    const skip = (page - 1) * limit;
    const reminders = await FeeReminder.find(query)
      .populate('student')
      .populate('transaction')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await FeeReminder.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fee reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fee reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const reminder = await FeeReminder.create(body);

    return NextResponse.json({
      success: true,
      data: reminder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating fee reminder:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create fee reminder'
      },
      { status: 500 }
    );
  }
}