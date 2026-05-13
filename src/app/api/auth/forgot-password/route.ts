import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If a user with that email exists, a password reset link will be sent.',
      });
    }

    // In production, send actual email with reset link
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error: any) {
    console.error('Error sending reset email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reset email' },
      { status: 500 }
    );
  }
}