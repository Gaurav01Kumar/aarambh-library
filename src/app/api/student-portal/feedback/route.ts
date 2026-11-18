import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AppFeedback from '@/lib/models/AppFeedback';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId is required' },
        { status: 400 }
      );
    }

    const feedback = await AppFeedback.findOne({ studentId });
    return NextResponse.json({
      success: true,
      data: {
        hasSubmitted: !!feedback,
        feedback,
      },
    });
  } catch (error: any) {
    console.error('Error checking feedback:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check feedback status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { studentId, studentEmail, studentName, rating, category, message } = body;

    if (!studentId || !studentEmail || !rating || !message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rating and feedback message are required' },
        { status: 400 }
      );
    }

    const existing = await AppFeedback.findOne({ studentId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted your one-time app feedback.' },
        { status: 409 }
      );
    }

    const feedback = await AppFeedback.create({
      studentId,
      studentEmail: studentEmail.trim().toLowerCase(),
      studentName: studentName || '',
      rating: Number(rating),
      category: category || 'Overall Experience',
      message: message.trim(),
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

