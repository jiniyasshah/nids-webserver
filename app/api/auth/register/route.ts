import { NextResponse } from "next/server";
import { connectToMongoose } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/user";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToMongoose();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with isAdmin set to false by default
    const result = await User.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "User created successfully", userId: result._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
