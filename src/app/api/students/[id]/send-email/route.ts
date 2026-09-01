import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { subject, message, template } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; margin: 0; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; }
    .body { padding: 28px 24px; }
    .body p { color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 14px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; }
    .info-box p { margin: 4px 0; font-size: 13px; }
    .footer { text-align: center; padding: 20px 24px; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aarambh Library</h1>
      <p>${subject}</p>
    </div>
    <div class="body">
      <p>Hi <strong>${student.name}</strong>,</p>
      ${message.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
      <div class="info-box">
        <p><strong>Your Details:</strong></p>
        <p>📧 Email: ${student.email}</p>
        <p>💺 Seat: ${student.seatNumber || 'N/A'}</p>
        <p>📋 Plan: ${student.subscriptionPlan || 'N/A'}</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Aarambh Library • aarambhlibrary.com</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: student.email,
      subject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${student.email}`,
    });
  } catch (error: any) {
    console.error('Error sending email to student:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
