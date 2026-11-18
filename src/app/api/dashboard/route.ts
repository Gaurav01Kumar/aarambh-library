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
    const userRole = request.headers.get('x-user-role');
    if (userRole === 'student') {
      return NextResponse.json(
        { success: false, error: 'Access denied: Admin credentials required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month') || 'all'; // e.g., "all" or "2026-11"
    const yearParam = searchParams.get('year'); // optional year for 12-month chart

    let dateFilterStart: Date | null = null;
    let dateFilterEnd: Date | null = null;
    let selectedMonthLabel = 'All Time';

    if (monthParam && monthParam !== 'all' && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [yStr, mStr] = monthParam.split('-');
      const year = parseInt(yStr, 10);
      const monthIndex = parseInt(mStr, 10) - 1; // 0-indexed
      dateFilterStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      dateFilterEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      selectedMonthLabel = dateFilterStart.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      });
    }

    // Helper to check if a date falls inside the selected month range
    const isWithinSelectedMonth = (d: any): boolean => {
      if (!dateFilterStart || !dateFilterEnd) return true;
      if (!d) return false;
      const dt = new Date(d);
      return dt >= dateFilterStart && dt <= dateFilterEnd;
    };

    // Get all active students
    const students = await Student.find({ isActive: true });
    const totalActiveStudents = students.length;

    // Students joined in selected period
    const newStudentsInPeriod = dateFilterStart
      ? students.filter((s) =>
          isWithinSelectedMonth(s.joinDate || s.createdAt)
        ).length
      : totalActiveStudents;

    // Get occupied seats & total seats
    const occupiedSeats = await Seat.countDocuments({ isOccupied: true });
    const totalSeats = await Seat.countDocuments({});

    // Fetch all Payments, Expenses, and Transactions so we can compute both
    // the filtered period stats AND the 12-month breakdown accurately
    let allPayments: any[] = [];
    let allExpenses: any[] = [];
    let allTransactions: any[] = [];

    try {
      allPayments = await Payment.find({
        status: { $nin: ['failed', 'fake'] },
        isFake: { $ne: true },
      }).sort({ createdAt: -1 });
    } catch (e) {
      console.error('Error fetching payments:', e);
    }

    try {
      allExpenses = await Expense.find({}).sort({ createdAt: -1 });
    } catch (e) {
      console.error('Error fetching expenses:', e);
    }

    try {
      allTransactions = await Transaction.find({
        status: { $nin: ['failed', 'fake'] },
        isFake: { $ne: true },
      }).sort({ createdAt: -1 });
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }

    // Filter records for the selected month (or all time)
    const filteredPayments = allPayments.filter((p) =>
      isWithinSelectedMonth(p.date || p.createdAt)
    );
    const filteredExpenses = allExpenses.filter((e) => {
      if (monthParam !== 'all' && e.month === monthParam) return true;
      return isWithinSelectedMonth(e.date || e.createdAt);
    });
    const filteredTransactions = allTransactions.filter((t) =>
      isWithinSelectedMonth(t.date || t.createdAt)
    );

    // Calculate Revenue for selected period
    let paymentRevenue = filteredPayments.reduce(
      (sum, p) => sum + Number(p.paidAmount ?? p.totalPrice ?? p.amount ?? 0),
      0
    );

    // Fallback only when viewing "all" time and no explicit payment documents exist yet
    if (monthParam === 'all' && paymentRevenue === 0 && students.length > 0 && allPayments.length === 0) {
      const paidSum = students
        .filter((s) => s.feeStatus === 'paid')
        .reduce((sum, s) => sum + (s.feeAmount || 1000), 0);
      if (paidSum > 0) {
        paymentRevenue = paidSum;
      }
    }

    const extraIncomeFromExpenses = filteredExpenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const transactionIncome = filteredTransactions
      .filter((t) => t.type === 'income' && t.category !== 'Fees')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalRevenue = paymentRevenue + extraIncomeFromExpenses + transactionIncome;

    // Calculate Expenses for selected period
    const expenseCollectionTotal = filteredExpenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const transactionExpenseTotal = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpenses = expenseCollectionTotal + transactionExpenseTotal;

    // Build 12-Month Breakdown for the target year (defaults to current year or selected month's year)
    const targetYear = yearParam
      ? parseInt(yearParam, 10)
      : dateFilterStart
      ? dateFilterStart.getFullYear()
      : new Date().getFullYear();

    const monthlyBreakdown = Array.from({ length: 12 }, (_, idx) => {
      const mStart = new Date(targetYear, idx, 1, 0, 0, 0, 0);
      const mEnd = new Date(targetYear, idx + 1, 0, 23, 59, 59, 999);
      const ymKey = `${targetYear}-${String(idx + 1).padStart(2, '0')}`;

      const inMonth = (d: any) => {
        if (!d) return false;
        const dt = new Date(d);
        return dt >= mStart && dt <= mEnd;
      };

      const mPayments = allPayments.filter((p) => inMonth(p.date || p.createdAt));
      const mExpenses = allExpenses.filter(
        (e) => e.month === ymKey || inMonth(e.date || e.createdAt)
      );
      const mTxns = allTransactions.filter((t) => inMonth(t.date || t.createdAt));

      const rev =
        mPayments.reduce(
          (s, p) => s + Number(p.paidAmount ?? p.totalPrice ?? p.amount ?? 0),
          0
        ) +
        mExpenses
          .filter((e) => e.type === 'income')
          .reduce((s, e) => s + Number(e.amount || 0), 0) +
        mTxns
          .filter((t) => t.type === 'income' && t.category !== 'Fees')
          .reduce((s, t) => s + Number(t.amount || 0), 0);

      const exp =
        mExpenses
          .filter((e) => e.type === 'expense')
          .reduce((s, e) => s + Number(e.amount || 0), 0) +
        mTxns
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount || 0), 0);

      const newStuds = students.filter((s) =>
        inMonth(s.joinDate || s.createdAt)
      ).length;

      return {
        month: ymKey,
        shortLabel: mStart.toLocaleDateString('en-IN', { month: 'short' }),
        label: mStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
        paymentsCount: mPayments.length,
        newStudents: newStuds,
      };
    });

    // Attendance stats for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let todayAttendanceLogs: any[] = [];
    let monthlyAttendanceCount = 0;
    try {
      todayAttendanceLogs = await Attendance.find({
        date: { $gte: startOfToday, $lte: endOfToday },
        status: 'success',
      });

      if (dateFilterStart && dateFilterEnd) {
        monthlyAttendanceCount = await Attendance.countDocuments({
          date: { $gte: dateFilterStart, $lte: dateFilterEnd },
          status: 'success',
        });
      } else {
        monthlyAttendanceCount = await Attendance.countDocuments({
          status: 'success',
        });
      }
    } catch (e) {
      console.error('Error fetching attendance logs:', e);
    }

    const attendedStudentIds = new Set(
      todayAttendanceLogs.map((l) => (l.student ? l.student.toString() : ''))
    );

    const studentsPresent = students.filter((s) => {
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

    const expiringSoon = students.filter(
      (s) =>
        s.subscriptionExpiry &&
        new Date(s.subscriptionExpiry) <= sevenDaysFromNow
    );

    // Recent Transactions Aggregation (filtered by selected month)
    const mergedTransactions: any[] = [];

    filteredPayments.slice(0, 15).forEach((p) => {
      mergedTransactions.push({
        _id: p._id.toString(),
        title: `Fee Payment - ${p.studentName || 'Student'}`,
        subtitle: `Fee Collection (${p.months || 1} Month)`,
        studentName: p.studentName || 'Student',
        amount: p.paidAmount ?? p.totalPrice ?? p.amount ?? 0,
        type: 'income',
        paymentMethod: p.paymentMethod || 'cash',
        status: p.status || 'completed',
        date: p.date || p.createdAt,
      });
    });

    filteredExpenses.slice(0, 15).forEach((e) => {
      mergedTransactions.push({
        _id: e._id.toString(),
        title: e.description || e.category || 'Library Expense',
        subtitle: `${e.type === 'income' ? 'Income' : 'Expense'} • ${e.category || 'General'}`,
        studentName: e.vendor || 'Vendor',
        amount: e.amount || 0,
        type: e.type || 'expense',
        paymentMethod: e.paymentMethod || 'cash',
        status: 'completed',
        date: e.date || e.createdAt,
      });
    });

    filteredTransactions.slice(0, 15).forEach((t) => {
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

    mergedTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recentTransactions = mergedTransactions.slice(0, 8);

    // Suspicious attendance attempts
    let suspiciousAttempts: any[] = [];
    try {
      const suspiciousQuery: any = { status: 'failed' };
      if (dateFilterStart && dateFilterEnd) {
        suspiciousQuery.createdAt = { $gte: dateFilterStart, $lte: dateFilterEnd };
      }
      const rawSuspicious = await Attendance.find(suspiciousQuery)
        .sort({ createdAt: -1 })
        .limit(5);

      suspiciousAttempts = rawSuspicious.map((a) => ({
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
        filter: {
          month: monthParam,
          year: targetYear,
          label: selectedMonthLabel,
        },
        overview: {
          totalStudents: totalActiveStudents,
          newStudentsInPeriod,
          occupiedSeats,
          totalSeats,
          availableSeats: Math.max(0, totalSeats - occupiedSeats),
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          todayAttendance: studentsPresent,
          absentToday: studentsAbsent,
          monthlyAttendanceCount,
          paymentsCount: filteredPayments.length,
          expiringSoonCount: expiringSoon.length,
          totalActiveStudents,
          overdueStudents: students.filter(
            (s) => s.feeStatus === 'unpaid' || s.feeStatus === 'partial'
          ).length,
        },
        students: {
          paid: students.filter((s) => s.feeStatus === 'paid').length,
          unpaid: students.filter(
            (s) => s.feeStatus === 'unpaid' || s.feeStatus === 'partial'
          ).length,
          total: totalActiveStudents,
        },
        monthlyBreakdown,
        recentTransactions,
        suspiciousAttempts,
        expiringMemberships: expiringSoon.map((s) => ({
          _id: s._id,
          name: s.name,
          seatNumber: s.seatNumber,
          expiryDate: s.subscriptionExpiry,
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
