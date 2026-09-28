import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { paymentId, clearAmount, paymentMethod, utr, date, remarks } = body;

    if (!paymentId || !clearAmount) {
      return NextResponse.json(
        { success: false, error: 'Payment ID and amount to clear are required' },
        { status: 400 }
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      );
    }

    const parsedClearAmount = parseFloat(clearAmount);
    if (isNaN(parsedClearAmount) || parsedClearAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid clearance amount' },
        { status: 400 }
      );
    }

    const payDate = new Date(date || Date.now());
    const method = paymentMethod || 'cash';
    const autoTxnId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalUtr = utr && utr.trim() !== '' ? utr.trim() : autoTxnId;

    // Previous paid amount
    const prevPaid = payment.paidAmount !== undefined ? payment.paidAmount : (payment.totalPrice - (payment.dueAmount || 0));
    const newPaidAmount = prevPaid + parsedClearAmount;
    const diff = newPaidAmount - payment.totalPrice;

    let newDueAmount = 0;
    let newAdvanceAmount = 0;
    let newStatus: 'completed' | 'partial' = 'completed';
    let newPaymentType: 'full' | 'partial' | 'advance' = 'full';
    let studentFeeStatus = 'paid';

    if (diff < 0) {
      newDueAmount = Math.abs(diff);
      newStatus = 'partial';
      newPaymentType = 'partial';
      studentFeeStatus = 'partial';
    } else if (diff > 0) {
      newAdvanceAmount = diff;
      newStatus = 'completed';
      newPaymentType = 'advance';
      studentFeeStatus = 'paid';
    }

    // Update remarks
    const clearedNote = `[Due Cleared ₹${parsedClearAmount} on ${payDate.toLocaleDateString('en-IN')}${remarks ? ` - ${remarks}` : ''}]`;
    const updatedRemarks = payment.remarks
      ? `${payment.remarks} | ${clearedNote}`
      : clearedNote;

    payment.paidAmount = newPaidAmount;
    payment.dueAmount = newDueAmount;
    payment.advanceAmount = newAdvanceAmount;
    payment.status = newStatus;
    payment.paymentType = newPaymentType;
    payment.remarks = updatedRemarks;
    await payment.save();

    // Create a transaction for this clearance payment
    await Transaction.create({
      title: `Due Cleared - ${payment.studentName}`,
      amount: parsedClearAmount,
      type: 'income',
      category: 'Fees',
      paymentMethod: method,
      date: payDate,
      description: `Remaining fee clearance of ₹${parsedClearAmount} for ${payment.studentName}${remarks ? ` - ${remarks}` : ''}`,
      utr: finalUtr,
    });

    // Update student feeStatus
    await Student.findByIdAndUpdate(payment.studentId, {
      feeStatus: studentFeeStatus,
    });

    // Optional admin notification
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      sendAdminNotification({
        eventType: 'paymentReceived',
        subject: `Due Cleared: ₹${parsedClearAmount.toLocaleString()} from ${payment.studentName}`,
        title: `✅ Due / Remaining Balance Cleared`,
        detailsHtml: `
          <p><strong>Student:</strong> ${payment.studentName}</p>
          <p><strong>Amount Cleared:</strong> ₹${parsedClearAmount.toLocaleString()}</p>
          <p><strong>Total Paid Now:</strong> ₹${newPaidAmount.toLocaleString()} of ₹${payment.totalPrice.toLocaleString()}</p>
          <p><strong>Remaining Due:</strong> ₹${newDueAmount.toLocaleString()}</p>
          <p><strong>Method:</strong> ${method.toUpperCase()}</p>
          <p><strong>Txn ID / Ref:</strong> <code>${finalUtr}</code></p>
          ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
        `,
      }).catch(err => console.error('Admin notification error:', err));
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ₹${parsedClearAmount.toLocaleString()} for ${payment.studentName}`,
      data: payment,
    });
  } catch (error: any) {
    console.error('Error clearing due payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clear due payment' },
      { status: 500 }
    );
  }
}
