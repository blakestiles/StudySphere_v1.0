import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";

    if (q.length < 2 || q.length > 100) {
      return NextResponse.json(
        { error: "Query must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const regex = { $regex: q, $options: "i" };

    // Get all study pack IDs belonging to this user for scoping topic/flashcard searches
    const userStudyPacks = await StudyPack.find({ userId }).select("_id").lean();
    const studyPackIds = userStudyPacks.map((s) => s._id);

    const [documents, studyPacks, topics, flashcards] = await Promise.all([
      Document.find({ userId, title: regex })
        .select("_id title")
        .limit(5)
        .lean(),
      StudyPack.find({ userId, title: regex })
        .select("_id title")
        .limit(5)
        .lean(),
      Topic.find({ studyPackId: { $in: studyPackIds }, name: regex })
        .select("_id name studyPackId")
        .limit(5)
        .lean(),
      Flashcard.find({ studyPackId: { $in: studyPackIds }, question: regex })
        .select("_id question studyPackId")
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      documents: documents.map((d) => ({ _id: d._id, title: d.title, type: "document" })),
      studyPacks: studyPacks.map((s) => ({ _id: s._id, title: s.title, type: "studypack" })),
      topics: topics.map((t) => ({ _id: t._id, name: t.name, studyPackId: t.studyPackId, type: "topic" })),
      flashcards: flashcards.map((f) => ({ _id: f._id, question: f.question, studyPackId: f.studyPackId, type: "flashcard" })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
