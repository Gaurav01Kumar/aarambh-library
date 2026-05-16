import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

// Get individual student daily report
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get today's payments for this student
    const todayPayments = await Payment.find({
      studentId: params.id,
      date: { $gte: todayStart, $lt: todayEnd },
    });

    // Get all payments
    const allPayments = await Payment.find({ studentId: params.id }).sort({ createdAt: -1 });

    // Get transactions
    const transactions = await Transaction.find({
      $or: [
        { studentId: params.id },
        { referenceId: params.id },
      ],
    }).sort({ date: -1 }).limit(50);

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
        },
        todayPayments,
        allPayments,
        transactions,
        dailySummary: {
          totalPaidToday: todayPayments.reduce((sum, p) => sum + p.totalPrice, 0),
          numberOfPaymentsToday: todayPayments.length,
        },
      },
    });
  } catch (error) {
    console.error('Daily student report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
