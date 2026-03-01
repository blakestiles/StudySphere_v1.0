import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import ChatMessage from "@/models/ChatMessage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const thread = await ChatThread.findById(id);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (String(thread.userId) !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await Promise.all([
      ChatMessage.deleteMany({ threadId: id }),
      ChatThread.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat thread error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
