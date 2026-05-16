import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Seat from '@/lib/models/Seat';
import Transaction from '@/lib/models/Transaction';
import Attendance from '@/lib/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get total students
    const totalStudents = await Student.countDocuments({ isActive: true });

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

    // Get paid vs unpaid students
    const paidStudents = await Student.countDocuments({ feeStatus: 'paid', isActive: true });
    const unpaidStudents = await Student.countDocuments({ feeStatus: 'unpaid', isActive: true });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Get overdue students
    const overdueStudents = await Student.countDocuments({
      feeStatus: 'unpaid',
      feeDueDate: { $lt: new Date() },
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          occupiedSeats,
          totalSeats,
          availableSeats: totalSeats - occupiedSeats,
          revenue: revenueResult[0]?.total || 0,
          expenses: expensesResult[0]?.total || 0,
          profit: (revenueResult[0]?.total || 0) - (expensesResult[0]?.total || 0),
          todayAttendance,
          overdueStudents,
        },
        students: {
          paid: paidStudents,
          unpaid: unpaidStudents,
          total: totalStudents,
        },
        recentTransactions,
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
