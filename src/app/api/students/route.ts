import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const feeStatus = searchParams.get('feeStatus') || '';
    const isActive = searchParams.get('isActive') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { seatNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (feeStatus) {
      query.feeStatus = feeStatus;
    }

    if (isActive) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'idProof', 'idProofNumber', 'seatNumber', 'startTime', 'endTime'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email: body.email });
    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student with this email already exists' },
        { status: 400 }
      );
    }

    // Generate QR code if not provided
    const qrCode = body.qrCode || `STU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const student = await Student.create({
      ...body,
      qrCode,
    });

    // Send Welcome Email to Student & Admin Notification
    try {
      const { sendStudentWelcomeEmail, sendAdminNotification } = await import('@/lib/email');

      // 1. Welcome Email to Student
      sendStudentWelcomeEmail({
        to: student.email,
        name: student.name,
        seatNumber: student.seatNumber,
        startTime: student.startTime,
        endTime: student.endTime,
        feeAmount: student.feeAmount,
        qrCode: student.qrCode,
      }).catch(err => console.error('Error sending student welcome email:', err));

      // 2. Notification Email to Admin
      sendAdminNotification({
        eventType: 'studentRegistration',
        subject: `New Student Registered: ${student.name}`,
        title: `🎓 New Student Registration`,
        detailsHtml: `
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 4px 0;"><strong>Student Name:</strong> ${student.name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${student.email}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> +91 ${student.phone}</p>
            <p style="margin: 4px 0;"><strong>Assigned Seat:</strong> Seat ${student.seatNumber || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Shift Timing:</strong> ${student.startTime || '--'} to ${student.endTime || '--'}</p>
            <p style="margin: 4px 0;"><strong>Subscription Plan:</strong> ${student.subscriptionPlan || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Monthly Fee Rate:</strong> ₹${student.feeAmount || 0}</p>
          </div>
        `,
      }).catch(err => console.error('Error sending admin student registration notification:', err));
    } catch (notificationErr) {
      console.error('Failed to trigger student creation email notifications:', notificationErr);
    }

    return NextResponse.json({
      success: true,
      data: student,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating student:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { success: false, error: `Student with this ${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create student'
      },
      { status: 500 }
    );
  }
}