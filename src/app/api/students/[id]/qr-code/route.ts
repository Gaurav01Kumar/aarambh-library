import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const student = await Student.findById(params.id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Generate QR code if not exists
    if (!student.qrCode) {
      student.qrCode = `STU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await student.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCode: student.qrCode,
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}