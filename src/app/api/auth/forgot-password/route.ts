import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Forgot Password] Looking up account with email:', email);

    // Find user by email in User collection
    let account = await User.findOne({ email });
    let isStudent = false;

    // If not found, try Student collection
    if (!account) {
      account = await Student.findOne({ email });
      if (account) {
        isStudent = true;
      }
    }

    if (!account) {
      console.log('[Forgot Password] No account found with email:', email);
      return NextResponse.json(
        { success: false, error: 'No account found with this email address. Please check and try again.' },
        { status: 404 }
      );
    }

    console.log(`[Forgot Password] Account found in ${isStudent ? 'Student' : 'User'} collection:`, account.name, '| Generating reset token...');

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry (1 hour) to user using findByIdAndUpdate to bypass model cache
    const Model = isStudent ? Student : User;
    await Model.findByIdAndUpdate(account._id, {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    console.log('[Forgot Password] Reset token saved. Sending email...');

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send reset email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; margin: 0; padding: 40px 0; }
    .container { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px 28px; }
    .body p { color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 8px 0 24px; }
    .btn:hover { background: #4338ca; }
    .warning { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 16px; }
    .footer { text-align: center; padding: 20px 24px; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; margin: 0; }
    .url-fallback { word-break: break-all; font-size: 11px; color: #6366f1; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Setup / Reset</h1>
      <p>Aarambh Library</p>
    </div>
    <div class="body">
      <p>Hi <strong>${account.name}</strong>,</p>
      <p>We received a request to set up or reset the password for your account. Click the button below to set a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Set Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="url-fallback">${resetUrl}</div>
      <div class="warning">
        ⏳ This link will expire in <strong>1 hour</strong>.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Aarambh Library • This is an automated email</p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: email,
      subject: '🔐 Set Your Password — Aarambh Library',
      html: emailHtml,
    });

    console.log('[Forgot Password] ✅ Email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email',
    });
  } catch (error: any) {
    console.error('[Forgot Password] ❌ Error:', error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send setup email. Please try again.' },
      { status: 500 }
    );
  }
}