import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const studyPacks = await StudyPack.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .populate("documentId", "title");

    return NextResponse.json(studyPacks);
  } catch (error) {
    console.error("Study packs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
