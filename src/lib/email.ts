import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';

export interface InvoiceEmailPayload {
  to: string;
  studentName: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  subscriptionPlan?: string;
  seatNumber?: string;
  transactionId?: string;
  remarks?: string;
  organizationName?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}) {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE !== 'false'; // true for 465, false for 587
  const user = process.env.SMTP_USER || 'info@aarambhlibrary.com';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || `"Aarambh Library" <${user}>`;

  if (!pass) {
    throw new Error('SMTP_PASS is not configured in .env. Please set Hostinger email password.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from,
    to,
    subject,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

export function generateInvoiceHTML(payload: InvoiceEmailPayload) {
  const org = payload.organizationName || 'Aarambh Library';
  const dateFormatted = payload.paymentDate
    ? new Date(payload.paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 30px; }
    .greeting { font-size: 16px; margin-bottom: 20px; color: #334155; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: 600; font-size: 12px; padding: 4px 12px; rounded-radius: 9999px; border-radius: 20px; }
    .invoice-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px border-dashed #cbd5e1; font-size: 14px; }
    .invoice-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 600; text-align: right; }
    .total-row { background: #eef2ff; border-radius: 6px; padding: 12px; margin-top: 15px; text-align: right; font-size: 18px; color: #4338ca; font-weight: 700; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-t: 1px solid #f1f5f9; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${org}</h1>
      <p>Official Payment Receipt / Invoice</p>
    </div>
    <div class="content">
      <p class="greeting">Dear <strong>${payload.studentName}</strong>,</p>
      <p style="font-size:14px; color:#475569;">Thank you for your payment. Here are the details of your official invoice:</p>
      
      <div class="invoice-card">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Invoice No:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #4f46e5; font-size: 14px;">${payload.invoiceNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Payment Date:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">${dateFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Payment Method:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px; text-transform: uppercase;">${payload.paymentMethod}</td>
          </tr>
          ${payload.seatNumber ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Assigned Seat:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">Seat ${payload.seatNumber}</td>
          </tr>
          ` : ''}
          ${payload.subscriptionPlan ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Plan / Membership:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">${payload.subscriptionPlan}</td>
          </tr>
          ` : ''}
          ${payload.transactionId ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Transaction ID / Ref:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">${payload.transactionId}</td>
          </tr>
          ` : ''}
          ${payload.remarks ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Notes / Remarks:</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px;">${payload.remarks}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #eef2ff; border-radius: 8px; text-align: right;">
          <span style="font-size: 14px; color: #4338ca; font-weight: 600;">Amount Paid: </span>
          <span style="font-size: 22px; color: #3730a3; font-weight: 800; margin-left: 10px;">₹${payload.amount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 30px;">
        If you have any questions regarding this invoice, please reach out to library administration or email <strong>info@aarambhlibrary.com</strong>.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${org}. All rights reserved.</p>
      <p>Automated Billing System • aarambhlibrary.com</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendAdminNotification({
  eventType,
  subject,
  title,
  detailsHtml,
}: {
  eventType: 'studentRegistration' | 'attendanceMark' | 'paymentReceived' | 'feeReminders';
  subject: string;
  title: string;
  detailsHtml: string;
}) {
  try {
    const Organization = (await import('@/lib/models/Organization')).default;
    await connectDB();
    const org = await Organization.findOne();
    
    // Check if preference for eventType is disabled
    if (org && org.settings?.notificationPreferences) {
      if (org.settings.notificationPreferences[eventType] === false) {
        return;
      }
    }

    let recipients: string[] = [];
    if (org && org.settings?.notificationEmails && org.settings.notificationEmails.length > 0) {
      recipients = org.settings.notificationEmails
        .flatMap((e: string) => e.split(','))
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0 && e.includes('@'));
    }

    // Fallback to SMTP_USER or org.email if no custom emails configured
    if (recipients.length === 0) {
      const defaultMail = org?.email || process.env.SMTP_USER || 'info@aarambhlibrary.com';
      recipients = [defaultMail];
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; }
    .header { background: #1e293b; padding: 20px; text-align: center; color: #ffffff; }
    .header h2 { margin: 0; font-size: 20px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
    .body { padding: 25px; font-size: 14px; line-height: 1.6; }
    .footer { text-align: center; padding: 15px; font-size: 12px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Aarambh Library Alert</h2>
      <span class="badge">${eventType.replace(/([A-Z])/g, ' $1')}</span>
    </div>
    <div class="body">
      <h3 style="margin-top:0; color:#0f172a;">${title}</h3>
      ${detailsHtml}
    </div>
    <div class="footer">
      Automated System Alert • Aarambh Library Management
    </div>
  </div>
</body>
</html>
    `;

    // Send to all notification email recipients asynchronously
    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient,
          subject: `[Notification] ${subject}`,
          html,
        });
      } catch (err) {
        console.error(`Failed to send admin notification to ${recipient}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
  }
}

export async function sendStudentWelcomeEmail({
  to,
  name,
  seatNumber,
  startTime,
  endTime,
  feeAmount,
  qrCode,
}: {
  to: string;
  name: string;
  seatNumber?: string;
  startTime?: string;
  endTime?: string;
  feeAmount?: number;
  qrCode?: string;
}) {
  try {
    const Organization = (await import('@/lib/models/Organization')).default;
    await connectDB();
    const org = await Organization.findOne();
    const orgName = org?.name || 'Aarambh Library';

    const formatTimeHelper = (timeStr?: string) => {
      if (!timeStr) return '--:--';
      const [h, m] = timeStr.split(':');
      if (!h || !m) return timeStr;
      let hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 30px; font-size: 15px; line-height: 1.6; }
    .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #64748b; background: #f1f5f9; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${orgName}! 🎉</h1>
      <p>Your Membership & Registration is Confirmed</p>
    </div>
    <div class="body">
      <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>
      <p>We are delighted to welcome you to <strong>${orgName}</strong>! Your library membership registration has been completed successfully.</p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #3730a3; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Registration Details</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Member Name:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Registered Email:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #4338ca;">${to}</td>
          </tr>
          ${seatNumber ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Assigned Seat:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #16a34a;">Seat ${seatNumber}</td>
          </tr>
          ` : ''}
          ${startTime && endTime ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Shift Timing:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${formatTimeHelper(startTime)} - ${formatTimeHelper(endTime)}</td>
          </tr>
          ` : ''}
          ${feeAmount ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Monthly Fee Rate:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">₹${feeAmount.toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          ${qrCode ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Student Access Code:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; font-family: monospace; color: #4338ca;">${qrCode}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="font-size: 14px; color: #475569;">
        Please make sure to follow library guidelines and keep your seat clean. If you have any questions or require assistance, feel free to contact the library administration desk.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
      <p>Automated Registration Email • info@aarambhlibrary.com</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to,
      subject: `Welcome to ${orgName}! Registration Details`,
      html,
    });
  } catch (error) {
    console.error('Error in sendStudentWelcomeEmail:', error);
  }
}

export async function sendFraudPaymentWarningEmail({
  to,
  studentName,
  amount,
  transactionId,
  receiptNumber,
  reason,
  seatNumber,
}: {
  to: string;
  studentName: string;
  amount: number;
  transactionId?: string;
  receiptNumber?: string;
  reason?: string;
  seatNumber?: string;
}) {
  try {
    const Organization = (await import('@/lib/models/Organization')).default;
    await connectDB();
    const org = await Organization.findOne();
    const orgName = org?.name || 'Aarambh Library';
    const orgPhone = org?.phone || '+91 9876543210';
    const orgEmail = org?.email || 'info@aarambhlibrary.com';

    const flagReason = reason || 'Payment transaction reference could not be verified with official bank records.';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 24px 10px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 2px solid #ef4444; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.25); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; }
    .header p { margin: 8px 0 0 0; opacity: 0.95; font-size: 13px; font-weight: 500; }
    .body { padding: 32px 28px; font-size: 14px; line-height: 1.6; color: #334155; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #991b1b; }
    .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .consequences { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 13px; color: #9a3412; }
    .consequences ul { margin: 8px 0 0 0; padding-left: 20px; }
    .consequences li { margin-bottom: 6px; }
    .btn { display: inline-block; background: #dc2626; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 10px; text-align: center; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 URGENT: Payment Verification Failed</h1>
      <p>Official Security & Accounts Notice • ${orgName}</p>
    </div>

    <div class="body">
      <p>Dear <strong>${studentName}</strong>,</p>

      <div class="alert-box">
        <strong>⚠️ FRAUD ALERT / INVALID TRANSACTION:</strong><br>
        Your recent library payment submission of <strong>₹${amount.toLocaleString('en-IN')}</strong> has failed account audit and has been officially marked as <strong>FAKE / INVALID</strong> by the administration.
      </div>

      <div class="card">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Flagged Transaction Details</h3>
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Student Name:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right; color: #0f172a;">${studentName}</td>
          </tr>
          ${seatNumber ? `
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Assigned Seat:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right; color: #dc2626;">Seat ${seatNumber} (At Risk)</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Claimed Amount:</td>
            <td style="padding: 7px 0; font-weight: 800; text-align: right; color: #dc2626; font-size: 16px;">₹${amount.toLocaleString('en-IN')}</td>
          </tr>
          ${transactionId ? `
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Transaction Ref / UTR:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right; font-family: monospace; color: #334155;">${transactionId}</td>
          </tr>
          ` : ''}
          ${receiptNumber ? `
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Receipt Number:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right; font-family: monospace; color: #334155;">${receiptNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Administrative Reason:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right; color: #991b1b;">${flagReason}</td>
          </tr>
        </table>
      </div>

      <div class="consequences">
        <strong>⚠️ Immediate Administrative Actions Enforced:</strong>
        <ul>
          <li>Your Library Fee Status has been immediately reverted to <strong>UNPAID</strong>.</li>
          <li>Your assigned seat is placed on hold and subject to immediate reallocation.</li>
          <li>Digital gate QR pass attendance access may be suspended upon entry.</li>
        </ul>
      </div>

      <p style="font-weight: 600; color: #0f172a; margin-top: 20px;">
        Required Action (Within 24 Hours):
      </p>
      <p style="font-size: 13px; color: #475569;">
        Please visit the <strong>${orgName}</strong> administration front desk with genuine bank transfer confirmation or clear your pending fee dues in cash to prevent disciplinary action and permanent membership termination.
      </p>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        For urgent assistance, contact the accounts desk:<br>
        📞 <strong>${orgPhone}</strong> | ✉️ <strong>${orgEmail}</strong>
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${orgName} • Security & Accounts Department</p>
      <p>This is an automated administrative warning email.</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to,
      subject: `🚨 URGENT NOTICE: Payment Verification Failed / Flagged as Invalid — ${orgName}`,
      html,
    });
    console.log(`[Fraud Email] Dispatched fake payment warning email to: ${to}`);
  } catch (error) {
    console.error('Error in sendFraudPaymentWarningEmail:', error);
  }
}


