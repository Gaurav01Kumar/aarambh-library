import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by email and valid token in User collection
    let account = await User.findOne({
      email,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });
    
    let isStudent = false;

    // If not found in User, check Student collection
    if (!account) {
      account = await Student.findOne({
        email,
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      });
      if (account) {
        isStudent = true;
      }
    }

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token using findByIdAndUpdate
    const Model = isStudent ? Student : User;
    await Model.findByIdAndUpdate(account._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now sign in.',
    });
  } catch (error: any) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set password' },
      { status: 500 }
    );
  }
}
