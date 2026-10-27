import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Transaction from '@/lib/models/Transaction';
import Payment from '@/lib/models/Payment';
import Student from '@/lib/models/Student';
import { sendFraudPaymentWarningEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Payment verification failed: Unverified / Fake payment proof provided.';

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);

    // 1. Look for matching Payment
    let payment = null;
    if (isObjectId) {
      payment = await Payment.findById(id);
    }
    if (!payment) {
      payment = await Payment.findOne({
        $or: [
          { transactionId: id },
          { utr: id },
          { receiptNumber: id },
        ],
      });
    }

    // 2. Look for matching Transaction
    let transaction = null;
    if (isObjectId) {
      transaction = await Transaction.findById(id);
    }
    if (!transaction) {
      transaction = await Transaction.findOne({
        $or: [
          { referenceId: id },
          { utr: id },
          { receiptNumber: id },
          ...(payment?._id ? [{ paymentId: payment._id }] : []),
          ...(payment?.transactionId ? [{ referenceId: payment.transactionId }] : []),
        ],
      });
    }

    // If transaction was found, but payment wasn't found yet:
    if (transaction && !payment) {
      payment = await Payment.findOne({
        $or: [
          ...(transaction.paymentId ? [{ _id: transaction.paymentId }] : []),
          ...(transaction._id ? [{ transactionId: transaction._id.toString() }] : []),
          ...(transaction.referenceId ? [{ transactionId: transaction.referenceId }] : []),
          ...(transaction.utr ? [{ utr: transaction.utr }] : []),
          ...(transaction.receiptNumber ? [{ receiptNumber: transaction.receiptNumber }] : []),
        ],
      });
    }

    if (!transaction && !payment) {
      return NextResponse.json(
        { success: false, error: 'Transaction or Payment record not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // 3. Update Transaction to 'fake'
    if (transaction) {
      transaction.status = 'fake';
      transaction.isFake = true;
      transaction.fakeReason = reason;
      transaction.fakeFlaggedAt = now;
      await transaction.save();
    }

    // 4. Update Payment to 'fake'
    if (payment) {
      payment.status = 'fake';
      payment.isFake = true;
      payment.fakeReason = reason;
      payment.fakeFlaggedAt = now;
      await payment.save();
    }

    // 5. Locate associated student to revert fee status & dispatch warning email
    let studentId = payment?.studentId || transaction?.studentId;
    let student = null;

    if (studentId) {
      student = await Student.findById(studentId);
    }

    // Fallback: search student by name from title or studentName
    if (!student && (payment?.studentName || transaction?.studentName || transaction?.title)) {
      const searchName = payment?.studentName || transaction?.studentName || transaction?.title?.replace(/^Fee Payment -\s*/i, '').trim();
      if (searchName) {
        student = await Student.findOne({
          name: { $regex: new RegExp(`^${searchName.trim()}$`, 'i') },
        });
      }
    }

    let emailSent = false;

    if (student) {
      // REVERT student fee status to 'unpaid'
      student.feeStatus = 'unpaid';
      await student.save();

      // DISPATCH WARNING EMAIL to the student
      if (student.email) {
        try {
          await sendFraudPaymentWarningEmail({
            to: student.email,
            studentName: student.name,
            amount: transaction?.amount || payment?.totalPrice || payment?.amount || 0,
            transactionId: transaction?.utr || payment?.utr || transaction?._id?.toString(),
            receiptNumber: payment?.receiptNumber || transaction?.receiptNumber,
            reason,
            seatNumber: student.seatNumber,
          });
          emailSent = true;
        } catch (emailErr) {
          console.error('Failed to send fraud warning email:', emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment officially flagged as fake. Student fee status reverted to unpaid.${
        emailSent ? ' Formal warning email has been sent to the student.' : ''
      }`,
      data: {
        transactionId: transaction?._id,
        paymentId: payment?._id,
        studentName: student?.name || payment?.studentName || 'Student',
        studentFeeStatus: 'unpaid',
        status: 'fake',
        emailSent,
      },
    });
  } catch (error: any) {
    console.error('Error marking payment as fake:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark payment as fake' },
      { status: 500 }
    );
  }
}
