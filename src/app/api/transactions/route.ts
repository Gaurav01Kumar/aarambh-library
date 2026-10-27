import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/lib/models/Transaction';
import Student from '@/lib/models/Student';
import Payment from '@/lib/models/Payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const rawTransactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

    // Fetch payments to map student information where needed
    const allPayments = await Payment.find().select('studentId studentName transactionId utr receiptNumber');
    const paymentByTxnId = new Map();
    const paymentByUtr = new Map();
    allPayments.forEach(p => {
      if (p.transactionId) paymentByTxnId.set(p.transactionId, p);
      if (p.utr) paymentByUtr.set(p.utr, p);
    });

    // Enhance transactions with student details
    const transactions = rawTransactions.map(t => {
      const obj = t.toObject();
      const matchedPayment = paymentByTxnId.get(t._id.toString()) || (t.utr && paymentByUtr.get(t.utr));

      let studentName = obj.studentName || matchedPayment?.studentName;
      if (!studentName && obj.title && obj.title.startsWith('Fee Payment -')) {
        studentName = obj.title.replace(/^Fee Payment -\s*/, '').split('(')[0].trim();
      }

      return {
        ...obj,
        student: {
          name: studentName || 'General / Library',
          email: obj.studentEmail || '',
        },
        receiptNumber: obj.receiptNumber || matchedPayment?.receiptNumber || `REC-${obj._id.toString().slice(-6)}`,
        transactionId: obj.utr || obj.referenceId || `TXN-${obj._id.toString().slice(-8)}`,
      };
    });

    // Exclude fake/fraudulent transactions from legitimate income summary
    const summaryMatch = { ...query, status: { $ne: 'fake' } };
    const summary = await Transaction.aggregate([
      { $match: summaryMatch },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      totalIncome: summary.find(s => s._id === 'income')?.total || 0,
      totalExpense: summary.find(s => s._id === 'expense')?.total || 0,
      fakeCount: rawTransactions.filter(t => t.status === 'fake' || t.isFake).length,
    };

    return NextResponse.json({
      success: true,
      data: transactions,
      stats: {
        ...stats,
        netProfit: stats.totalIncome - stats.totalExpense,
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.title || !body.amount || !body.type || !body.category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const transaction = await Transaction.create(body);

    // If this is a fee payment, also update student status and create payment record
    if (body.type === 'income' && body.category === 'Fees' && body.studentId) {
      await Student.findByIdAndUpdate(body.studentId, {
        feeStatus: 'paid',
      });

      await Payment.create({
        studentId: body.studentId,
        studentName: body.studentName || 'Unknown',
        amount: body.amount,
        months: body.months || 1,
        totalPrice: body.amount,
        paymentMethod: body.paymentMethod || 'cash',
        date: body.date,
        transactionId: transaction._id.toString(),
        status: 'completed',
      });
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
