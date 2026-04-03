import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import connectDB from "@/lib/db";
import Goal from "@/models/Goal";
import client from "@/lib/claude";
import { updateGoalSchema } from "@/lib/validations/goal";
import { TAGS } from "@/lib/data-cache";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`goal-update:${session.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const goal = await Goal.findById(id);
    if (!goal || goal.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (result.data.status !== undefined) goal.status = result.data.status;
    if (result.data.title !== undefined) goal.title = result.data.title;
    if (result.data.currentValue !== undefined) goal.currentValue = result.data.currentValue;

    // AI suggestion
    if (result.data.requestSuggestion) {
      const deadlineStr = goal.deadline
        ? `Deadline: ${goal.deadline.toISOString().split("T")[0]}`
        : "No deadline set";

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: "You are a motivational academic coach. Given a student's study goal data, provide a brief, motivational 2-3 sentence suggestion for how to achieve it. Respond with only the suggestion text.",
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              title: goal.title,
              targetValue: goal.targetValue,
              targetType: goal.targetType,
              currentValue: goal.currentValue,
              deadline: deadlineStr,
            }),
          },
        ],
      });

      const suggestion =
        message.content[0].type === "text" ? message.content[0].text : "";
      goal.aiSuggestion = suggestion;
    }

    await goal.save();

    revalidateTag(TAGS.goals(session.user.id), "");
    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Goal update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const goal = await Goal.findById(id);
    if (!goal || goal.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await Goal.findByIdAndDelete(id);

    revalidateTag(TAGS.goals(session.user.id), "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Goal delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
