import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

// This endpoint is called by the cron job to generate monthly reports
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Get all students
    const students = await Student.find({ isActive: true });

    // Get payments for current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthlyPayments = await Payment.find({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Get transactions for current month
    const monthlyTransactions = await Transaction.find({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Calculate statistics
    const totalCollected = monthlyPayments.reduce((sum, p) => sum + p.totalPrice, 0);
    const paidStudents = students.filter(s => s.feeStatus === 'paid').length;

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      stats: {
        totalStudents: students.length,
        paidStudents,
        unpaidStudents: students.length - paidStudents,
        totalCollected,
        totalTransactions: monthlyTransactions.length,
        averagePayment: monthlyPayments.length > 0
          ? Math.round(totalCollected / monthlyPayments.length)
          : 0,
      },
      payments: monthlyPayments.map(p => ({
        studentName: p.studentName,
        amount: p.amount,
        months: p.months,
        totalPrice: p.totalPrice,
        paymentMethod: p.paymentMethod,
        date: p.date,
      })),
      studentStatus: students.map(s => ({
        name: s.name,
        email: s.email,
        seatNumber: s.seatNumber,
        feeStatus: s.feeStatus,
        feeAmount: s.feeAmount,
        feeDueDate: s.feeDueDate,
      })),
    };

    // Store report in database (simple approach - could use a Reports collection)
    console.log('Monthly Report Generated:', report);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
