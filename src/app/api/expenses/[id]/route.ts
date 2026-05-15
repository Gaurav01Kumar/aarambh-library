import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";

// GET single expense
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const expense = await Expense.findById(id).populate(
      "processedBy",
      "-password",
    );

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch expense" },
      { status: 500 },
    );
  }
}

// UPDATE expense
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const body = await request.json();

    const expense = await Expense.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("processedBy", "-password");

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update expense",
      },
      { status: 500 },
    );
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
