import mongoose from 'mongoose';
import Student from '../src/lib/models/Student';
import Transaction from '../src/lib/models/Transaction';
import Payment from '../src/lib/models/Payment';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management';

async function dailyReport() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`Daily report cron triggered at: ${new Date().toISOString()}`);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get all students
    const students = await Student.find({ isActive: true });

    // Get today's payments
    const todayPayments = await Payment.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });

    // Get today's transactions
    const todayTransactions = await Transaction.find({
      date: { $gte: todayStart, $lt: todayEnd },
    });

    const totalCollectedToday = todayPayments.reduce((sum, p) => sum + p.totalPrice, 0);
    const paidStudents = students.filter(s => s.feeStatus === 'paid').length;

    console.log('\n=== Daily Report ===');
    console.log(`Date: ${now.toISOString().split('T')[0]}`);
    console.log(`- Total Students: ${students.length}`);
    console.log(`- Paid Students: ${paidStudents}`);
    console.log(`- Unpaid Students: ${students.length - paidStudents}`);
    console.log(`- Payments Today: ${todayPayments.length}`);
    console.log(`- Amount Collected: ₹${totalCollectedToday.toLocaleString()}`);
    console.log(`- Transactions Today: ${todayTransactions.length}`);

    // Monthly summary
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = await Payment.find({
      date: { $gte: monthStart },
    });
    const totalCollectedMonth = monthlyPayments.reduce((sum, p) => sum + p.totalPrice, 0);

    console.log(`\n=== Monthly Summary ===`);
    console.log(`- Month: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    console.log(`- Monthly Payments: ${monthlyPayments.length}`);
    console.log(`- Total Collected: ₹${totalCollectedMonth.toLocaleString()}`);

    // Export to CSV
    const fs = require('fs');
    const csv = [
      'Date,Student,Amount,Months,Total,Method',
      ...todayPayments.map(p =>
        `${new Date(p.date).toLocaleDateString()},${p.studentName},${p.amount},${p.months},${p.totalPrice},${p.paymentMethod}`
      ),
    ].join('\n');

    fs.writeFileSync(`./reports/daily-${now.toISOString().split('T')[0]}.csv`, csv);
    console.log(`\nReport saved to: reports/daily-${now.toISOString().split('T')[0]}.csv`);

    await mongoose.disconnect();
    console.log('\nDaily report completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error generating daily report:', error);
    process.exit(1);
  }
}

dailyReport();
