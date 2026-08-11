import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Student from '@/lib/models/Student';
import { sendEmail, generateInvoiceHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { paymentId, targetEmail } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    let student: any = null;
    if (payment.studentId) {
      try {
        student = await Student.findById(payment.studentId);
      } catch (e) {
        console.warn('Student lookup failed for ID:', payment.studentId);
      }
    }

    const recipientEmail = targetEmail || student?.email;

    if (!recipientEmail) {
      return NextResponse.json({ success: false, error: 'No recipient email address provided or found for this student.' }, { status: 400 });
    }

    const invoiceNumber = payment.receiptNumber || `INV-${payment._id.toString().slice(-6).toUpperCase()}`;

    const htmlContent = generateInvoiceHTML({
      to: recipientEmail,
      studentName: student?.name || payment.studentName || 'Valued Student',
      invoiceNumber,
      amount: payment.totalPrice || payment.amount || 0,
      paymentDate: payment.date || payment.createdAt,
      paymentMethod: payment.paymentMethod || 'cash',
      subscriptionPlan: student?.subscriptionPlan || `${payment.months || 1} Month(s)`,
      seatNumber: student?.seatNumber || payment.seatNumber,
      transactionId: payment.transactionId,
      organizationName: 'Aarambh Library',
    });

    await sendEmail({
      to: recipientEmail,
      subject: `Official Payment Invoice (${payment.receiptNumber || invoiceNumber}) - Aarambh Library`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `Invoice email successfully sent to ${recipientEmail} via Hostinger Webmail.`,
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send invoice email' },
      { status: 500 }
    );
  }
}
