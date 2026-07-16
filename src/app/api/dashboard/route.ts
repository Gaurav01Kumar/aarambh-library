import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Seat from '@/lib/models/Seat';
import Transaction from '@/lib/models/Transaction';
import Attendance from '@/lib/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all students for complex logic
    const students = await Student.find({ isActive: true });
    const totalActiveStudents = students.length;

    // Get occupied seats
    const occupiedSeats = await Seat.countDocuments({ isOccupied: true });
    const totalSeats = await Seat.countDocuments({});

    // Get revenue - all completed income transactions
    const revenueResult = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['income', 'fee', 'deposit'] },
          status: 'completed',
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const revenue = revenueResult[0]?.total || 0;

    // Get expenses - all expense transactions
    const expensesResult = await Transaction.aggregate([
      {
        $match: {
          type: 'expense',
          status: 'completed',
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const expenses = expensesResult[0]?.total || 0;

    // New Attendance Logic for Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studentsPresent = students.filter(s => 
      s.attendance?.some((record: any) => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      })
    ).length;

    const studentsAbsent = totalActiveStudents - studentsPresent;

    // Subscriptions Expiring Soon (in next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = students.filter(s => 
      s.subscriptionExpiry && 
      new Date(s.subscriptionExpiry) <= sevenDaysFromNow
    );

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get suspicious attendance attempts
    const suspiciousAttempts = await Attendance.find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name seatNumber');

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents: totalActiveStudents,
          occupiedSeats,
          totalSeats,
          availableSeats: totalSeats - occupiedSeats,
          revenue,
          expenses,
          profit: revenue - expenses,
          todayAttendance: studentsPresent,
          absentToday: studentsAbsent,
          expiringSoonCount: expiringSoon.length,
          totalActiveStudents,
          overdueStudents: students.filter(s => s.feeStatus === 'unpaid').length,
        },
        students: {
          paid: students.filter(s => s.feeStatus === 'paid').length,
          unpaid: students.filter(s => s.feeStatus === 'unpaid').length,
          total: totalActiveStudents,
        },
        recentTransactions,
        suspiciousAttempts: suspiciousAttempts.map(a => ({
          _id: a._id,
          studentName: a.student?.name || 'Unknown',
          seatNumber: a.seatNumber,
          reason: a.failureReason,
          time: a.createdAt,
        })),
        expiringMemberships: expiringSoon.map(s => ({
          _id: s._id,
          name: s.name,
          seatNumber: s.seatNumber,
          expiryDate: s.subscriptionExpiry
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
