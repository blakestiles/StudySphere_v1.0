import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import Document from "@/models/Document";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const sourcePack = await StudyPack.findById(id);
    if (!sourcePack || !sourcePack.isPublic) {
      return NextResponse.json({ error: "Pack not found or not public" }, { status: 404 });
    }

    const clonedDoc = await Document.create({
      userId: session.user.id,
      title: `${sourcePack.title} (Cloned)`,
      fileType: "text",
      rawText: `Cloned from marketplace pack: ${sourcePack.title}`,
      status: "ready",
    });

    const clonedPack = await StudyPack.create({
      userId: session.user.id,
      documentId: clonedDoc._id,
      title: `${sourcePack.title} (Clone)`,
      summaries: sourcePack.summaries,
      mindMap: sourcePack.mindMap,
      status: "ready",
      isPublic: false,
    });

    const sourceTopics = await Topic.find({ studyPackId: id }).lean();
    const topicIdMap = new Map<string, string>();

    if (sourceTopics.length > 0) {
      const clonedTopics = await Topic.insertMany(
        sourceTopics.map(t => ({
          studyPackId: clonedPack._id,
          name: t.name,
          content: t.content,
          order: t.order,
        }))
      );
      sourceTopics.forEach((t, i) => topicIdMap.set(t._id.toString(), clonedTopics[i]._id.toString()));
    }

    const sourceFlashcards = await Flashcard.find({ studyPackId: id }).lean();
    if (sourceFlashcards.length > 0) {
      await Flashcard.insertMany(sourceFlashcards.map(f => ({
        studyPackId: clonedPack._id,
        topicId: (f.topicId && topicIdMap.get(f.topicId.toString())) ?? f.topicId,
        question: f.question,
        answer: f.answer,
        difficulty: f.difficulty,
        sourcePage: (f as any).sourcePage ?? null,
      })));
    }

    const sourceQuizzes = await QuizQuestion.find({ studyPackId: id }).lean();
    if (sourceQuizzes.length > 0) {
      await QuizQuestion.insertMany(sourceQuizzes.map(q => ({
        studyPackId: clonedPack._id,
        topicId: (q.topicId && topicIdMap.get(q.topicId.toString())) ?? q.topicId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })));
    }

    return NextResponse.json({ success: true, packId: clonedPack._id });
  } catch (error) {
    console.error("Clone error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
