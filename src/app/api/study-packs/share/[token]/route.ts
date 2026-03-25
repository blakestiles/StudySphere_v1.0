import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  await connectDB();

  const pack = await StudyPack.findOne({ shareToken: token, isPublic: true }).lean();
  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [topicCount, flashcardCount] = await Promise.all([
    Topic.countDocuments({ studyPackId: pack._id }),
    Flashcard.countDocuments({ studyPackId: pack._id }),
  ]);

  return NextResponse.json({
    pack: {
      _id: String(pack._id),
      title: pack.title,
      summaries: pack.summaries,
      topicCount,
      flashcardCount,
      createdAt: pack.createdAt,
    },
  });
}
