import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import WeeklyReport from "@/models/WeeklyReport";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const reports = await WeeklyReport.find({ userId: session.user.id })
      .sort({ weekStart: -1 })
      .limit(12)
      .lean();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Fetch weekly reports error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
