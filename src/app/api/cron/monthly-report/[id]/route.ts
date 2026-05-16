import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

// Generate individual student monthly report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const student = await Student.findById(params.id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get student's payments this month
    const monthlyPayments = await Payment.find({
      studentId: params.id,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Get all student payments
    const allPayments = await Payment.find({ studentId: params.id }).sort({ createdAt: -1 });

    // Get student's transactions
    const transactions = await Transaction.find({
      $or: [
        { studentId: params.id },
        { referenceId: params.id },
      ],
    }).sort({ date: -1 });

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
        monthlyPayments,
        allPayments,
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
