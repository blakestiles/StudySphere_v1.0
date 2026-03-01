import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import FocusSession from "@/models/FocusSession";
import { completeFocusSessionSchema } from "@/lib/validations/focus-session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = completeFocusSessionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const focusSession = await FocusSession.findById(id);
    if (!focusSession) {
      return NextResponse.json({ error: "Focus session not found" }, { status: 404 });
    }

    if (focusSession.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    focusSession.recap = result.data.recap;
    if (result.data.completedGoals !== undefined) {
      focusSession.completedGoals = result.data.completedGoals;
    }
    if (result.data.sessionsCompleted !== undefined) {
      focusSession.sessionsCompleted = result.data.sessionsCompleted;
    }
    focusSession.completedAt = new Date();
    await focusSession.save();

    return NextResponse.json({ focusSession });
  } catch (error) {
    console.error("Complete focus session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
