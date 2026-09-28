import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500');

    const payments = await Payment.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

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
    const autoReceipt = `REC-${Date.now().toString().slice(-6)}`;
    const finalUtr = utr && utr.trim() !== '' ? utr.trim() : autoTxnId;

    const parsedTotalPrice = parseFloat(totalPrice) || 0;
    const finalPaidAmount = body.paidAmount !== undefined && body.paidAmount !== ''
      ? parseFloat(body.paidAmount)
      : parsedTotalPrice;

    const diff = finalPaidAmount - parsedTotalPrice;
    let dueAmount = 0;
    let advanceAmount = 0;
    let paymentType: 'full' | 'partial' | 'advance' = 'full';
    let paymentStatus: 'completed' | 'partial' = 'completed';
    let studentFeeStatus = 'paid';

    if (diff < 0) {
      dueAmount = Math.abs(diff);
      paymentType = 'partial';
      paymentStatus = 'partial';
      studentFeeStatus = 'partial';
    } else if (diff > 0) {
      advanceAmount = diff;
      paymentType = 'advance';
      paymentStatus = 'completed';
      studentFeeStatus = 'paid';
    }

    // Create payment record
    const payment = await Payment.create({
      studentId,
      studentName: student.name,
      amount: student.feeAmount,
      months: parseInt(months),
      totalPrice: parsedTotalPrice,
      paidAmount: finalPaidAmount,
      dueAmount,
      advanceAmount,
      paymentType,
      remarks: body.remarks || '',
      paymentMethod,
      date: paymentDate,
      transactionId: autoTxnId,
      utr: finalUtr,
      receiptNumber: autoReceipt,
      status: paymentStatus,
    });

    // Create transaction record (income for the actual paid amount)
    const transaction = await Transaction.create({
      title: `Fee Payment - ${student.name}${paymentType === 'partial' ? ` (Partial - Due: ₹${dueAmount})` : ''}`,
      amount: finalPaidAmount,
      type: 'income',
      category: 'Fees',
      paymentMethod,
      date: paymentDate,
      description: `${months} month${parseInt(months) > 1 ? 's' : ''} payment for ${student.name}${body.remarks ? ` - Note: ${body.remarks}` : ''}`,
      utr: finalUtr,
    });

    // Update student fee status
    await Student.findByIdAndUpdate(studentId, {
      feeStatus: studentFeeStatus,
      feeDueDate: new Date(new Date(date).setMonth(new Date(date).getMonth() + parseInt(months))),
    });

    // Trigger Admin Notification Email
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      sendAdminNotification({
        eventType: 'paymentReceived',
        subject: `Payment Received: ₹${finalPaidAmount.toLocaleString()} from ${student.name}${dueAmount > 0 ? ` (Due: ₹${dueAmount})` : ''}`,
        title: `💳 New Payment Collection Recorded`,
        detailsHtml: `
          <p><strong>Student:</strong> ${student.name}</p>
          <p><strong>Total Fee:</strong> ₹${parsedTotalPrice.toLocaleString()}</p>
          <p><strong>Amount Paid:</strong> ₹${finalPaidAmount.toLocaleString()}</p>
          ${dueAmount > 0 ? `<p><strong>Pending Due:</strong> <span style="color: #dc2626; font-weight: bold;">₹${dueAmount.toLocaleString()}</span></p>` : ''}
          ${advanceAmount > 0 ? `<p><strong>Advance Paid:</strong> <span style="color: #16a34a; font-weight: bold;">₹${advanceAmount.toLocaleString()}</span></p>` : ''}
          <p><strong>Payment Mode:</strong> ${paymentMethod.toUpperCase()}</p>
          <p><strong>Txn ID / Ref:</strong> <code>${finalUtr}</code></p>
          ${body.remarks ? `<p><strong>Remarks:</strong> ${body.remarks}</p>` : ''}
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
