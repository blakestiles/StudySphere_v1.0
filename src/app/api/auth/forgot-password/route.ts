import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "If that email exists, a reset link has been sent." }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (err) {
        console.error("Failed to send reset email:", err);
      }
    }

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
