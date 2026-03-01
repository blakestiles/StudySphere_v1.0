import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import { createThreadSchema } from "@/lib/validations/chat";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const threads = await ChatThread.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .populate("studyPackId", "title")
      .lean();

    const serialized = threads.map((t) => ({
      _id: String(t._id),
      title: t.title,
      studyPackId: t.studyPackId
        ? {
            _id: String((t.studyPackId as any)._id),
            title: (t.studyPackId as any).title,
          }
        : null,
      createdAt: new Date(t.createdAt).toISOString(),
      updatedAt: new Date(t.updatedAt).toISOString(),
    }));

    return NextResponse.json({ threads: serialized });
  } catch (error) {
    console.error("Get chat threads error:", error);
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
    const result = createThreadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const threadData: any = {
      userId: session.user.id,
      title: result.data.title || "New Chat",
    };
    if (result.data.studyPackId) {
      threadData.studyPackId = result.data.studyPackId;
    }

    const thread = await ChatThread.create(threadData);

    return NextResponse.json({
      thread: {
        _id: String(thread._id),
        title: thread.title,
        studyPackId: thread.studyPackId ? String(thread.studyPackId) : null,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create chat thread error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
