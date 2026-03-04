import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Reminder from "@/models/Reminder";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const reminders = await Reminder.find({
      userId: session.user.id,
      triggerDate: { $lte: now },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error("Reminders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
