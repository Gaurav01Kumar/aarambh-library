import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month'); // Format: 2024-01
    const year = searchParams.get('year');

    const query: any = {};

    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
      query.date = {
        $gte: new Date(parseInt(year), 0, 1),
        $lte: new Date(parseInt(year), 11, 31, 23, 59, 59),
      };
    }

    // Get all payments for the period
    const payments = await Payment.find(query).sort({ createdAt: -1 });

    // Get all transactions for the period
    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Get students with their payment status
    const students = await Student.find({ isActive: true });

    // Calculate statistics
    const totalCollected = payments.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalTransactions = transactions.length;
    const paidStudents = students.filter(s => s.feeStatus === 'paid').length;

    return NextResponse.json({
      success: true,
      data: {
        payments,
        transactions,
        students: students.map(s => ({
          name: s.name,
          email: s.email,
          seatNumber: s.seatNumber,
          feeStatus: s.feeStatus,
          feeAmount: s.feeAmount,
          feeDueDate: s.feeDueDate,
        })),
        stats: {
          totalCollected,
          totalTransactions,
          paidStudents,
          totalStudents: students.length,
          unpaidStudents: students.length - paidStudents,
        },
      },
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
