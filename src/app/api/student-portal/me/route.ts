import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Attendance from '@/lib/models/Attendance';
import Organization from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email')?.trim().toLowerCase();
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { success: false, error: 'Email or Student ID is required' },
        { status: 400 }
      );
    }

    const query = id ? { _id: id } : { email };
    const student = await Student.findOne(query).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Fetch recent attendance logs specifically for this student
    let recentAttendance: any[] = [];
    try {
      const logs = await Attendance.find({ student: student._id })
        .sort({ date: -1, createdAt: -1 })
        .limit(15);
      
      if (logs.length > 0) {
        recentAttendance = logs;
      } else if (student.attendance && student.attendance.length > 0) {
        // Fallback to embedded attendance array
        recentAttendance = student.attendance
          .slice()
          .sort((a: any, b: any) => new Date(b.date || b.checkIn).getTime() - new Date(a.date || a.checkIn).getTime())
          .slice(0, 15);
      }
    } catch (e) {
      console.error('Error fetching student attendance logs:', e);
      if (student.attendance) {
        recentAttendance = student.attendance.slice(-15).reverse();
      }
    }

    // Get Library info
    let org = await Organization.findOne();
    const libraryInfo = {
      name: org?.name || 'Aarambh Library',
      phone: org?.phone || '+91 9876543210',
      email: org?.email || 'info@aarambhlibrary.com',
      address: org?.address || 'Main Road, Study Hub',
      checkInTime: org?.settings?.checkInTime || '08:00',
      checkOutTime: org?.settings?.checkOutTime || '22:00',
    };

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          seatNumber: student.seatNumber || 'Unassigned (Contact Admin)',
          qrCode: student.qrCode,
          startTime: student.startTime || '08:00',
          endTime: student.endTime || '20:00',
          selectedShifts: student.selectedShifts || [],
          feeStatus: student.feeStatus || 'unpaid',
          feeAmount: student.feeAmount || 0,
          feeDueDate: student.feeDueDate,
          subscriptionPlan: student.subscriptionPlan || 'basic',
          subscriptionExpiry: student.subscriptionExpiry,
          targetExam: student.targetExam || '',
          studyStage: student.studyStage || '',
          joinDate: student.joinDate,
          isActive: student.isActive,
        },
        attendance: recentAttendance,
        library: libraryInfo,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/student-portal/me:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch student data' },
      { status: 500 }
    );
  }
}
