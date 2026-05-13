import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/lib/models/Student";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, idProof, idProofNumber, startTime, endTime } = body;

    // Basic validation
    if (!name || !email || !phone || !idProof || !idProofNumber) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: "A student with this email already exists" },
        { status: 400 },
      );
    }

    // Generate a unique QR code string
    const qrCode = `STU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create new student
    const student = await Student.create({
      name,
      email,
      phone,
      idProof,
      idProofNumber,
      qrCode,
      startTime,
      endTime,
      isActive: true,
      feeStatus: 'unpaid',
      joinDate: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        data: {
          studentId: student._id,
          qrCode: student.qrCode,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error registering student:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register student" },
      { status: 500 },
    );
  }
}
