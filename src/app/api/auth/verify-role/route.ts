import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { email, id } = body;

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Email or ID is required' },
        { status: 400 }
      );
    }

    let user = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.trim().toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database', role: 'unknown' },
        { status: 404 }
      );
    }

    const isAdminOrStaff = user.role === 'admin' || user.role === 'staff';

    return NextResponse.json({
      success: true,
      role: user.role,
      isActive: user.isActive,
      isAdminOrStaff,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (error: any) {
    console.error('Error verifying role:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify role' },
      { status: 500 }
    );
  }
}
