import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Subscription from '@/lib/models/Subscription';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const planType = searchParams.get('planType') || '';
    const isActive = searchParams.get('isActive') || '';

    const query: any = {};

    if (planType) {
      query.planType = planType;
    }

    if (isActive) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const subscription = await Subscription.create(body);

    return NextResponse.json({
      success: true,
      data: subscription,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create subscription'
      },
      { status: 500 }
    );
  }
}