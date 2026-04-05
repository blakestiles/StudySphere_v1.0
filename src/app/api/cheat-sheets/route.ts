import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import CheatSheet from "@/models/CheatSheet";
import StudyPack from "@/models/StudyPack";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const packId = searchParams.get("packId");

    await connectDB();

    const filter: Record<string, unknown> = { userId: session.user.id };
    if (packId) filter.studyPackId = packId;

    const sheets = await CheatSheet.find(filter).sort({ createdAt: -1 }).lean();

    // Collect unique pack IDs and fetch titles in one query
    const packIds = [...new Set(sheets.map(s => String(s.studyPackId)))];
    const packs = await StudyPack.find({ _id: { $in: packIds } }).select("title").lean();
    const packTitleMap = Object.fromEntries(packs.map(p => [String(p._id), p.title as string]));

    return NextResponse.json(sheets.map(s => ({
      _id: String(s._id),
      studyPackId: String(s.studyPackId),
      packTitle: packTitleMap[String(s.studyPackId)] ?? "Unknown Pack",
      title: s.title as string,
      pages: s.pages as number,
      content: s.content as string,
      createdAt: new Date(s.createdAt as any).toISOString(),
    })));
  } catch (error) {
    console.error("Cheat sheets GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
