import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FeeReminder from '@/lib/models/FeeReminder';
import Student from '@/lib/models/Student';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function generateReminderEmailHTML({
  studentName,
  amount,
  dueDate,
  reminderType,
  seatNumber,
  organizationName,
}: {
  studentName: string;
  amount: number;
  dueDate: string;
  reminderType: string;
  seatNumber?: string;
  organizationName?: string;
}) {
  const org = organizationName || 'Aarambh Library';
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isOverdue = new Date(dueDate) < new Date();
  const urgencyLabel = {
    first: 'Friendly Reminder',
    second: 'Second Reminder',
    final: 'Final Reminder – Urgent',
    overdue: '⚠️ Overdue Notice',
  }[reminderType] || 'Fee Reminder';

  const urgencyColor = {
    first: '#3b82f6',
    second: '#f59e0b',
    final: '#ef4444',
    overdue: '#dc2626',
  }[reminderType] || '#4f46e5';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 10px; letter-spacing: 0.5px; }
    .content { padding: 30px; }
    .greeting { font-size: 16px; margin-bottom: 15px; color: #334155; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .amount-box { margin-top: 15px; padding: 16px; background: ${isOverdue ? '#fef2f2' : '#eef2ff'}; border-radius: 10px; text-align: center; border: 1px solid ${isOverdue ? '#fecaca' : '#c7d2fe'}; }
    .amount { font-size: 28px; font-weight: 800; color: ${isOverdue ? '#dc2626' : '#4338ca'}; }
    .amount-label { font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .cta { display: block; text-align: center; background: ${urgencyColor}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 25px 0; }
    .note { font-size: 13px; color: #64748b; text-align: center; margin-top: 20px; line-height: 1.6; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${org}</h1>
      <p>Library Fee Payment Reminder</p>
      <span class="badge">${urgencyLabel}</span>
    </div>
    <div class="content">
      <p class="greeting">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        ${isOverdue 
          ? `Your library fee payment was due on <strong>${dueDateFormatted}</strong> and is currently <strong style="color: #dc2626;">overdue</strong>. Please make the payment at your earliest convenience to continue your library membership without interruption.`
          : `This is a ${urgencyLabel.toLowerCase()} that your library fee payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> is due on <strong>${dueDateFormatted}</strong>. Please ensure timely payment to continue enjoying uninterrupted library services.`
        }
      </p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Member Name:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">${studentName}</td>
          </tr>
          ${seatNumber ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Assigned Seat:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #16a34a; font-size: 14px;">Seat ${seatNumber}</td>
          </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Due Date:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: ${isOverdue ? '#dc2626' : '#0f172a'}; font-size: 14px;">${dueDateFormatted}${isOverdue ? ' (OVERDUE)' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Reminder Type:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: ${urgencyColor}; font-size: 14px;">${urgencyLabel}</td>
          </tr>
        </table>
      </div>

      <div class="amount-box">
        <div class="amount-label">${isOverdue ? 'Outstanding Amount Due' : 'Amount Due'}</div>
        <div class="amount">₹${amount.toLocaleString('en-IN')}</div>
      </div>

      <p class="note">
        If you have already made the payment, please disregard this notice.<br>
        For payment queries, contact us at <strong>info@aarambhlibrary.com</strong> or visit the library administration desk.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${org}. All rights reserved.</p>
      <p>Automated Fee Reminder System • aarambhlibrary.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

// POST: Send a fee reminder email to a student
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { reminderId, studentId, amount, dueDate, reminderType, message } = body;

    // If reminderId provided, load existing reminder and its student
    let student: any = null;
    let reminder: any = null;

    if (reminderId) {
      reminder = await FeeReminder.findById(reminderId).populate('student');
      if (!reminder) {
        return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 });
      }
      student = reminder.student;
    } else if (studentId) {
      student = await Student.findById(studentId);
    }

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (!student.email) {
      return NextResponse.json({ success: false, error: `${student.name} does not have an email address` }, { status: 400 });
    }

    const finalAmount = amount || reminder?.amount || student.feeAmount || 0;
    const finalDueDate = dueDate || reminder?.dueDate || student.feeDueDate || new Date().toISOString();
    const finalType = reminderType || reminder?.reminderType || 'first';

    // Generate email HTML
    const emailHtml = generateReminderEmailHTML({
      studentName: student.name,
      amount: finalAmount,
      dueDate: finalDueDate,
      reminderType: finalType,
      seatNumber: student.seatNumber,
    });

    // Send email
    const subject = finalType === 'overdue' || finalType === 'final'
      ? `⚠️ URGENT: Fee Payment ${finalType === 'overdue' ? 'Overdue' : 'Final Reminder'} – ₹${finalAmount.toLocaleString('en-IN')}`
      : `Fee Payment Reminder – ₹${finalAmount.toLocaleString('en-IN')} due ${new Date(finalDueDate).toLocaleDateString('en-IN')}`;

    await sendEmail({
      to: student.email,
      subject,
      html: emailHtml,
    });

    // Create or update reminder record
    if (reminder) {
      reminder.status = 'sent';
      reminder.sentDate = new Date();
      reminder.sentVia = [...new Set([...(reminder.sentVia || []), 'email'])];
      reminder.emailTemplate = emailHtml;
      if (message) reminder.message = message;
      await reminder.save();
    } else {
      reminder = await FeeReminder.create({
        student: student._id,
        amount: finalAmount,
        dueDate: finalDueDate,
        reminderType: finalType,
        status: 'sent',
        sentDate: new Date(),
        sentVia: ['email'],
        message: message || `Fee reminder sent to ${student.name}`,
        emailTemplate: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Reminder email sent to ${student.name} (${student.email})`,
      data: reminder,
      emailPreview: emailHtml,
    });
  } catch (error: any) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
