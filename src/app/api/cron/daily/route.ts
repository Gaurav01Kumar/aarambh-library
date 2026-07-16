import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import Seat from '@/lib/models/Seat';

export async function GET(request: NextRequest) {
  try {
    // Optional: Protect the route using a secret key
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('[CRON] Starting daily database maintenance and status checks...');

    const now = new Date();
    const stats = {
      totalStudentsChecked: 0,
      membershipsExpired: 0,
      paymentsMarkedOverdue: 0,
      remindersGenerated: 0,
    };

    // Fetch all active students to check subscriptions and fee status
    const students = await Student.find({ isActive: true });
    stats.totalStudentsChecked = students.length;

    for (const student of students) {
      let updated = false;

      // 1. Check Membership Expiry
      if (student.subscriptionExpiry && new Date(student.subscriptionExpiry) < now) {
        student.isActive = false;
        stats.membershipsExpired++;
        updated = true;
        console.log(`[CRON] Expired membership for student: ${student.name} (${student._id})`);
      }

      // 2. Check Fee Status
      // If fee is due in the past and they haven't paid
      if (student.feeDueDate && new Date(student.feeDueDate) < now && student.feeStatus !== 'unpaid') {
        student.feeStatus = 'unpaid';
        stats.paymentsMarkedOverdue++;
        updated = true;
        console.log(`[CRON] Marked payment overdue for student: ${student.name} (${student._id})`);
        
        // 3. Generate Reminder (Here we just log it, but could insert into a Notification collection or send an email)
        console.log(`[CRON Reminder] 📧 Send payment reminder to ${student.email}`);
        stats.remindersGenerated++;
      }

      // Save if anything changed
      if (updated) {
        await student.save();
      }
    }

    // 4. Database maintenance: Clean up orphaned seats or expired temp records if needed
    // (Example logic for future extension)
    // await Seat.updateMany({ isAvailable: false, occupiedUntil: { $lt: now } }, { isAvailable: true, isOccupied: false });

    console.log('[CRON] Daily maintenance completed successfully.', stats);

    return NextResponse.json({
      success: true,
      message: 'Daily cron job executed successfully',
      data: stats
    });
  } catch (error: any) {
    console.error('[CRON] Error during daily maintenance:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
