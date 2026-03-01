import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import FocusSession from "@/models/FocusSession";
import { createFocusSessionSchema } from "@/lib/validations/focus-session";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const focusSessions = await FocusSession.find({ userId: session.user.id })
      .sort({ _id: -1 })
      .populate("studyPackId", "title");

    return NextResponse.json({ focusSessions });
  } catch (error) {
    console.error("Get focus sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createFocusSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const focusSession = await FocusSession.create({
      userId: session.user.id,
      studyPackId: result.data.studyPackId,
      duration: result.data.duration,
      goals: result.data.goals || [],
      workDuration: result.data.workDuration,
      shortBreakDuration: result.data.shortBreakDuration,
      longBreakDuration: result.data.longBreakDuration,
    });

    return NextResponse.json({ focusSession }, { status: 201 });
  } catch (error) {
    console.error("Create focus session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
