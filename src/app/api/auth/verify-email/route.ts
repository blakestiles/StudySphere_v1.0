import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ emailVerificationToken: token }).select(
      "+emailVerificationToken"
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
