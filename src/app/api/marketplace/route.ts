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

    if (packs.length === 0) return NextResponse.json([]);

    const packIds = packs.map((p) => p._id);
    const userIds = [...new Set(packs.map((p) => p.userId.toString()))];

    // Batch: one aggregate for all topic counts, one query for all authors
    const [topicCountRows, authors] = await Promise.all([
      Topic.aggregate([
        { $match: { studyPackId: { $in: packIds } } },
        { $group: { _id: "$studyPackId", count: { $sum: 1 } } },
      ]),
      User.find({ _id: { $in: userIds } }).select("name").lean(),
    ]);

    const topicCountMap = Object.fromEntries(
      topicCountRows.map((r: { _id: unknown; count: number }) => [String(r._id), r.count])
    );
    const authorMap = Object.fromEntries(
      (authors as { _id: unknown; name?: string }[]).map((u) => [String(u._id), u.name || "Anonymous"])
    );

    const enriched = packs.map((pack) => ({
      _id: String(pack._id),
      title: pack.title,
      summary: (pack.summaries as any)?.short || "",
      topicCount: topicCountMap[String(pack._id)] ?? 0,
      authorName: authorMap[pack.userId.toString()] ?? "Anonymous",
      isOwnPack: pack.userId.toString() === session!.user!.id,
      createdAt: pack.createdAt,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Marketplace GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
