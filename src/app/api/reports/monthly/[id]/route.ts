import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const student = await Student.findById(params.id)
      .populate('attendance');

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get student's payments
    const payments = await Payment.find({ studentId: params.id }).sort({ createdAt: -1 });

    // Get student's transactions
    const transactions = await Transaction.find({
      $or: [
        { studentId: params.id },
        { referenceId: params.id },
      ],
    }).sort({ date: -1 });

    // Calculate monthly summary
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    const monthlyPayments = payments.filter(p => {
      const d = new Date(p.createdAt);
      return d >= monthStart && d <= monthEnd;
    });

    const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.totalPrice, 0);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          name: student.name,
          email: student.email,
          phone: student.phone,
          seatNumber: student.seatNumber,
          feeStatus: student.feeStatus,
          feeAmount: student.feeAmount,
          joinDate: student.joinDate,
        },
        payments,
        transactions,
        monthlySummary: {
          totalPaidThisMonth: monthlyTotal,
          numberOfPayments: monthlyPayments.length,
          currentBalance: student.feeAmount * 12 - monthlyTotal,
        },
      },
    });
  } catch (error) {
    console.error('Error generating student report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
