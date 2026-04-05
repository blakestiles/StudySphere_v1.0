import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const packs = await StudyPack.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const enriched = await Promise.all(packs.map(async (pack) => {
      const [topicCount, author] = await Promise.all([
        Topic.countDocuments({ studyPackId: pack._id }),
        User.findById(pack.userId).select("name").lean(),
      ]);
      return {
        _id: String(pack._id),
        title: pack.title,
        shareToken: pack.shareToken,
        summary: (pack.summaries as any)?.short || "",
        topicCount,
        authorName: (author as any)?.name || "Anonymous",
        isOwnPack: pack.userId.toString() === session!.user!.id,
        createdAt: pack.createdAt,
      };
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Marketplace GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
