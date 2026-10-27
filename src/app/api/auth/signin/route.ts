import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 1. Try finding account in User collection
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: 'Account is inactive. Please contact the library administrator.' },
          { status: 403 }
        );
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user.toObject();

      return NextResponse.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token: 'demo-token',
        },
      });
    }

    // 2. If not found in User, check Student collection
    const student = await Student.findOne({ email: normalizedEmail });

    if (student) {
      if (!student.password) {
        return NextResponse.json(
          { success: false, error: 'Password not set yet. Please use "Forgot password?" to set your password.' },
          { status: 401 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, student.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (!student.isActive) {
        return NextResponse.json(
          { success: false, error: 'Student account is inactive. Please contact the library admin.' },
          { status: 403 }
        );
      }

      // Create or sync User document with role: 'student'
      const newUser = await User.create({
        name: student.name,
        email: student.email,
        password: student.password,
        phone: student.phone,
        role: 'student',
        studentId: student._id,
        isActive: true,
        lastLogin: new Date(),
      });

      const { password: _, ...userWithoutPassword } = newUser.toObject();

      return NextResponse.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token: 'student-token',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error signing in:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign in' },
      { status: 500 }
    );
  }
}