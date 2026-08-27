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
    const { studentId, months, totalPrice, paymentMethod, date, utr } = body;

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

    // Check for duplicate payment in the same calendar month
    const paymentDate = new Date(date || Date.now());
    const year = paymentDate.getFullYear();
    const monthIndex = paymentDate.getMonth();
    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const existingPayment = await Payment.findOne({
      studentId,
      status: 'completed',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (existingPayment && !body.allowDuplicate) {
      const monthName = paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return NextResponse.json(
        { 
          success: false, 
          error: `Payment for ${monthName} has already been recorded for ${student.name}. Duplicate payments for the same month are not allowed.` 
        },
        { status: 400 }
      );
    }

    // Generate transaction ID & custom UTR
    const autoTxnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalUtr = utr && utr.trim() !== '' ? utr.trim() : autoTxnId;

    // Create payment record
    const payment = await Payment.create({
      studentId,
      studentName: student.name,
      amount: student.feeAmount,
      months: parseInt(months),
      totalPrice,
      paymentMethod,
      date: paymentDate,
      transactionId: autoTxnId,
      utr: finalUtr,
      status: 'completed',
    });

    // Create transaction record (income)
    const transaction = await Transaction.create({
      title: `Fee Payment - ${student.name}`,
      amount: totalPrice,
      type: 'income',
      category: 'Fees',
      paymentMethod,
      date: paymentDate,
      description: `${months} month${parseInt(months) > 1 ? 's' : ''} payment for ${student.name}`,
      utr: finalUtr,
    });

    // Update student fee status
    await Student.findByIdAndUpdate(studentId, {
      feeStatus: 'paid',
      feeDueDate: new Date(new Date(date).setMonth(new Date(date).getMonth() + parseInt(months))),
    });

    // Trigger Admin Notification Email
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      sendAdminNotification({
        eventType: 'paymentReceived',
        subject: `Payment Received: ₹${totalPrice.toLocaleString()} from ${student.name}`,
        title: `💳 New Payment Collection Recorded`,
        detailsHtml: `
          <p><strong>Student:</strong> ${student.name}</p>
          <p><strong>Amount Collected:</strong> ₹${totalPrice.toLocaleString()}</p>
          <p><strong>Duration:</strong> ${months} Month(s)</p>
          <p><strong>Method:</strong> ${paymentMethod.toUpperCase()}</p>
          <p><strong>Txn ID / Ref:</strong> <code>${finalUtr}</code></p>
        `,
      }).catch(err => console.error('Admin notification error:', err));
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
    }

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
