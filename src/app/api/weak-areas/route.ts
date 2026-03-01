import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import WeakArea from "@/models/WeakArea";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const weakAreas = await WeakArea.find({ userId: session.user.id })
      .populate("topicId", "name studyPackId");

    return NextResponse.json({ weakAreas });
  } catch (error) {
    console.error("Get weak areas error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
