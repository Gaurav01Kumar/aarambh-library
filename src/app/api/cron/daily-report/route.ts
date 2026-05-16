import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

// Daily cron job - runs at night to generate reports
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    console.log(`Daily report cron triggered at: ${now.toISOString()}`);

    // Get all students
    const students = await Student.find({ isActive: true });

    // Get today's date range
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get payments and transactions for today
    const todayPayments = await Payment.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });

    const todayTransactions = await Transaction.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });

    // Calculate daily statistics
    const totalCollectedToday = todayPayments.reduce((sum, p) => sum + p.totalPrice, 0);
    const newPaymentsToday = todayPayments.length;
    const paidStudents = students.filter(s => s.feeStatus === 'paid').length;
    const unpaidStudents = students.length - paidStudents;

    // Generate daily summary
    const report = {
      type: 'daily',
      generatedAt: now.toISOString(),
      stats: {
        totalStudents: students.length,
        paidStudents,
        unpaidStudents,
        totalCollectedToday,
        newPaymentsToday,
        totalTransactionsToday: todayTransactions.length,
      },
      payments: todayPayments.map(p => ({
        studentName: p.studentName,
        amount: p.amount,
        months: p.months,
        totalPrice: p.totalPrice,
        paymentMethod: p.paymentMethod,
      })),
      // Include monthly summary as well
      monthlySummary: {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        monthlyPayments: await Payment.find({
          date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        }),
      },
    };

    console.log('Daily Report:');
    console.log(`- Total Students: ${report.stats.totalStudents}`);
    console.log(`- Paid: ${report.stats.paidStudents}, Unpaid: ${report.stats.unpaidStudents}`);
    console.log(`- Collected Today: ₹${report.stats.totalCollectedToday.toLocaleString()}`);
    console.log(`- New Payments: ${report.stats.newPaymentsToday}`);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Daily report cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate daily report' },
      { status: 500 }
    );
  }
}
