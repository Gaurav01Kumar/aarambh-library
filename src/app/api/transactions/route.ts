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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    const summary = await Transaction.aggregate([
      { $match: query },
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
    };

    return NextResponse.json({
      success: true,
      data: transactions,
      stats: {
        ...stats,
        netProfit: stats.totalIncome - stats.totalExpense
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
