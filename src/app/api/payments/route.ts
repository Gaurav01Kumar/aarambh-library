import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { studentId, months, totalPrice, paymentMethod, date } = body;

    if (!studentId || !months || !totalPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record
    const payment = await Payment.create({
      studentId,
      studentName: student.name,
      amount: student.feeAmount,
      months: parseInt(months),
      totalPrice,
      paymentMethod,
      date: new Date(date),
      transactionId,
      status: 'completed',
    });

    // Create transaction record (income)
    const transaction = await Transaction.create({
      title: `Fee Payment - ${student.name}`,
      amount: totalPrice,
      type: 'income',
      category: 'Fees',
      paymentMethod,
      date: new Date(date),
      description: `${months} month${parseInt(months) > 1 ? 's' : ''} payment for ${student.name}`,
      utr: transactionId,
    });

    // Update student fee status
    await Student.findByIdAndUpdate(studentId, {
      feeStatus: 'paid',
      feeDueDate: new Date(new Date(date).setMonth(new Date(date).getMonth() + parseInt(months))),
    });

    return NextResponse.json({
      success: true,
      data: payment,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
