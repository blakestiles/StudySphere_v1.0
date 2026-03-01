import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import EssayAttempt from "@/models/EssayAttempt";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const attempts = await EssayAttempt.find({ userId: session.user.id })
      .sort({ completedAt: -1 })
      .populate("studyPackId", "title");

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Essays GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
