import mongoose from 'mongoose';
import Student from '../src/lib/models/Student';
import Transaction from '../src/lib/models/Transaction';
import Payment from '../src/lib/models/Payment';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management';

async function generateMonthlyReport() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Get all students
    const students = await Student.find({ isActive: true });

    // Get payments for current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const monthlyPayments = await Payment.find({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Get transactions for current month
    const monthlyTransactions = await Transaction.find({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    // Calculate statistics
    const totalCollected = monthlyPayments.reduce((sum, p) => sum + p.totalPrice, 0);
    const paidStudents = students.filter(s => s.feeStatus === 'paid').length;

    // Generate report
    const report = {
      generatedAt: new Date().toISOString(),
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      stats: {
        totalStudents: students.length,
        paidStudents,
        unpaidStudents: students.length - paidStudents,
        totalCollected,
        totalTransactions: monthlyTransactions.length,
        averagePayment: monthlyPayments.length > 0
          ? Math.round(totalCollected / monthlyPayments.length)
          : 0,
      },
      payments: monthlyPayments.map(p => ({
        studentName: p.studentName,
        amount: p.amount,
        months: p.months,
        totalPrice: p.totalPrice,
        paymentMethod: p.paymentMethod,
        date: p.date,
      })),
      studentStatus: students.map(s => ({
        name: s.name,
        email: s.email,
        seatNumber: s.seatNumber,
        feeStatus: s.feeStatus,
        feeAmount: s.feeAmount,
        feeDueDate: s.feeDueDate,
      })),
    };

    console.log('Monthly Report Generated:');
    console.log(JSON.stringify(report, null, 2));

    // Store report
    console.log('Report summary:');
    console.log(`- Total Students: ${report.stats.totalStudents}`);
    console.log(`- Paid Students: ${report.stats.paidStudents}`);
    console.log(`- Unpaid Students: ${report.stats.unpaidStudents}`);
    console.log(`- Total Collected: ₹${report.stats.totalCollected.toLocaleString()}`);
    console.log(`- Transactions: ${report.stats.totalTransactions}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    process.exit(1);
  }
}

generateMonthlyReport();
