import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Seat from '@/lib/models/Seat';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';
import Expense from '@/lib/models/Expense';
import Attendance from '@/lib/models/Attendance';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all students for stats
    const students = await Student.find({ isActive: true });
    const totalActiveStudents = students.length;

    // Get occupied seats & total seats
    const occupiedSeats = await Seat.countDocuments({ isOccupied: true });
    const totalSeats = await Seat.countDocuments({});

    // Revenue calculation
    let paymentRevenue = 0;
    try {
      const paymentRevenueAgg = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalPrice', '$amount'] } } } }
      ]);
      paymentRevenue = paymentRevenueAgg[0]?.total || 0;
    } catch (e) {
      console.error('Error calculating payment revenue:', e);
    }

    // Fallback: If no explicit payment collection records exist yet, sum feeAmount of paid students
    if (paymentRevenue === 0 && students.length > 0) {
      const paidSum = students
        .filter(s => s.feeStatus === 'paid')
        .reduce((sum, s) => sum + (s.feeAmount || 1000), 0);
      if (paidSum > 0) {
        paymentRevenue = paidSum;
      }
    }

    let transactionIncome = 0;
    try {
      const transactionIncomeAgg = await Transaction.aggregate([
        { $match: { type: 'income', category: { $ne: 'Fees' }, status: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      transactionIncome = transactionIncomeAgg[0]?.total || 0;
    } catch (e) {
      console.error('Error calculating transaction income:', e);
    }

    const totalRevenue = paymentRevenue + transactionIncome;

    // Expenses calculation
    let expenseCollectionTotal = 0;
    try {
      const expenseAgg = await Expense.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      expenseCollectionTotal = expenseAgg[0]?.total || 0;
    } catch (e) {
      console.error('Error calculating expense total:', e);
    }

    let transactionExpenseTotal = 0;
    try {
      const transactionExpenseAgg = await Transaction.aggregate([
        { $match: { type: 'expense', status: { $ne: 'failed' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      transactionExpenseTotal = transactionExpenseAgg[0]?.total || 0;
    } catch (e) {
      console.error('Error calculating transaction expense:', e);
    }

    const totalExpenses = expenseCollectionTotal + transactionExpenseTotal;

    // Attendance stats for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let todayAttendanceLogs: any[] = [];
    try {
      todayAttendanceLogs = await Attendance.find({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: 'success'
      });
    } catch (e) {
      console.error('Error fetching today attendance logs:', e);
    }
    const attendedStudentIds = new Set(todayAttendanceLogs.map(l => l.student ? l.student.toString() : ''));

    const studentsPresent = students.filter(s => {
      const hasLog = attendedStudentIds.has(s._id.toString());
      const hasDoc = s.attendance?.some((record: any) => {
        const d = new Date(record.date || record.checkIn);
        return d >= startOfToday && d <= endOfToday;
      });
      return hasLog || hasDoc;
    }).length;

    const studentsAbsent = Math.max(0, totalActiveStudents - studentsPresent);

    // Expiring memberships in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringSoon = students.filter(s => 
      s.subscriptionExpiry && 
      new Date(s.subscriptionExpiry) <= sevenDaysFromNow
    );

    // Recent Transactions Aggregation
    const mergedTransactions: any[] = [];

    try {
      const rawPayments = await Payment.find().sort({ createdAt: -1 }).limit(10);
      rawPayments.forEach(p => {
        mergedTransactions.push({
          _id: p._id.toString(),
          title: `Fee Payment - ${p.studentName || 'Student'}`,
          subtitle: `Fee Collection (${p.months || 1} Month)`,
          studentName: p.studentName || 'Student',
          amount: p.totalPrice || p.amount || 0,
          type: 'income',
          paymentMethod: p.paymentMethod || 'cash',
          status: p.status || 'completed',
          date: p.date || p.createdAt,
        });
      });
    } catch (e) {
      console.error('Error fetching raw payments:', e);
    }

    try {
      const rawExpenses = await Expense.find().sort({ createdAt: -1 }).limit(10);
      rawExpenses.forEach(e => {
        mergedTransactions.push({
          _id: e._id.toString(),
          title: e.description || e.category || 'Library Expense',
          subtitle: `Expense • ${e.category || 'General'}`,
          studentName: e.vendor || 'Vendor',
          amount: e.amount || 0,
          type: 'expense',
          paymentMethod: e.paymentMethod || 'cash',
          status: 'completed',
          date: e.date || e.createdAt,
        });
      });
    } catch (e) {
      console.error('Error fetching raw expenses:', e);
    }

    try {
      const rawTxns = await Transaction.find().sort({ createdAt: -1 }).limit(10);
      rawTxns.forEach(t => {
        if (t.category !== 'Fees') {
          mergedTransactions.push({
            _id: t._id.toString(),
            title: t.title || 'Transaction',
            subtitle: t.description || t.category || 'General',
            studentName: t.category || 'Income',
            amount: t.amount || 0,
            type: t.type || 'income',
            paymentMethod: t.paymentMethod || 'cash',
            status: t.status || 'completed',
            date: t.date || t.createdAt,
          });
        }
      });
    } catch (e) {
      console.error('Error fetching raw transactions:', e);
    }

    // Sort combined list by date descending
    mergedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = mergedTransactions.slice(0, 6);

    // Get suspicious attendance attempts without populate errors
    let suspiciousAttempts: any[] = [];
    try {
      const rawSuspicious = await Attendance.find({ status: 'failed' })
        .sort({ createdAt: -1 })
        .limit(5);
      
      suspiciousAttempts = rawSuspicious.map(a => ({
        _id: a._id,
        studentName: a.seatNumber ? `Student @ ${a.seatNumber}` : 'Student Attempt',
        seatNumber: a.seatNumber || 'N/A',
        reason: a.failureReason || 'Verification Failed',
        time: a.createdAt,
      }));
    } catch (e) {
      console.error('Error fetching suspicious attempts:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents: totalActiveStudents,
          occupiedSeats,
          totalSeats,
          availableSeats: Math.max(0, totalSeats - occupiedSeats),
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          todayAttendance: studentsPresent,
          absentToday: studentsAbsent,
          expiringSoonCount: expiringSoon.length,
          totalActiveStudents,
          overdueStudents: students.filter(s => s.feeStatus === 'unpaid' || s.feeStatus === 'partial').length,
        },
        students: {
          paid: students.filter(s => s.feeStatus === 'paid').length,
          unpaid: students.filter(s => s.feeStatus === 'unpaid' || s.feeStatus === 'partial').length,
          total: totalActiveStudents,
        },
        recentTransactions,
        suspiciousAttempts,
        expiringMemberships: expiringSoon.map(s => ({
          _id: s._id,
          name: s.name,
          seatNumber: s.seatNumber,
          expiryDate: s.subscriptionExpiry
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
