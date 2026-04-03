import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Goal from "@/models/Goal";
import { createGoalSchema } from "@/lib/validations/goal";
import { TAGS } from "@/lib/data-cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const goals = await Goal.find({ userId: session.user.id })
      .sort({ status: 1, deadline: 1 })
      .lean();

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Goals fetch error:", error);
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
    const result = createGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const goal = await Goal.create({
      userId: session.user.id,
      title: result.data.title,
      description: result.data.description || "",
      targetType: result.data.targetType,
      targetValue: result.data.targetValue,
      deadline: result.data.deadline ? new Date(result.data.deadline) : undefined,
    });

    revalidateTag(TAGS.goals(session.user.id), "");
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Goal create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
