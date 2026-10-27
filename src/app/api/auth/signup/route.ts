import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Student from "@/lib/models/Student";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, phone } = body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Check if user already exists in User collection
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Look for existing Student profile or create one
    let student = await Student.findOne({ email: normalizedEmail });

    if (student) {
      // Link existing student record and update password
      student.password = hashedPassword;
      if (phone && !student.phone) student.phone = phone;
      await student.save();
    } else {
      // Create new student profile with a unique QR pass
      const qrCode = `STU-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      student = await Student.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || "",
        idProof: "self_registered",
        idProofNumber: "PENDING_VERIFICATION",
        qrCode,
        feeStatus: "unpaid",
        isActive: true,
        subscriptionPlan: "basic",
        joinDate: new Date(),
      });
    }

    // CRITICAL SECURITY FIX:
    // Public signup is strictly for STUDENTS/MEMBERS only.
    // NEVER grant 'admin' or 'staff' role through public signup.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: "student", // Strictly student role!
      studentId: student._id,
      isActive: true,
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully",
        data: {
          user: {
            ...userWithoutPassword,
            role: "student",
            studentId: student._id,
          },
          token: "student-token",
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error signing up:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 },
    );
  }
}
