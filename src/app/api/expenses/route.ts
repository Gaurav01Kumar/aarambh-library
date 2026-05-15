import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const month = searchParams.get("month");

    const year = Number(
      searchParams.get("year") || new Date().getFullYear()
    );

    const query: Record<string, unknown> = {};

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (month) {
      query.month = month;
    }

    if (year) {
      query.year = year;
    }

    const skip = (page - 1) * limit;

    const expenses = await Expense.find(query)
      .populate("processedBy", "-password")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch expenses",
      },
      { status: 500 }
    );
  }
}

// CREATE expense
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const expense = await Expense.create(body);

    return NextResponse.json(
      {
        success: true,
        data: expense,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating expense:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create expense";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}