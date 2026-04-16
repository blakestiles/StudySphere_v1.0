import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import ClozeQuestion from "@/models/ClozeQuestion";
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

    const alreadyCloned = await StudyPack.findOne({
      userId: session.user.id,
      clonedFrom: sourcePack._id,
    });
    if (alreadyCloned) {
      return NextResponse.json({ error: "You already cloned this pack" }, { status: 409 });
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
      clonedFrom: sourcePack._id,
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
      // Remap parentTopicId to cloned IDs
      const bulkOps = clonedTopics
        .map((nt, i) => {
          const oldParent = sourceTopics[i].parentTopicId;
          if (!oldParent) return null;
          const newParent = topicIdMap.get(String(oldParent));
          if (!newParent) return null;
          return { updateOne: { filter: { _id: nt._id }, update: { $set: { parentTopicId: newParent } } } };
        })
        .filter(Boolean);
      if (bulkOps.length > 0) await Topic.bulkWrite(bulkOps as any);
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

    const sourceCloze = await ClozeQuestion.find({ studyPackId: id }).lean();
    if (sourceCloze.length > 0) {
      await ClozeQuestion.insertMany(sourceCloze.map((c: any) => ({
        studyPackId: clonedPack._id,
        topicId: (c.topicId && topicIdMap.get(c.topicId.toString())) ?? c.topicId,
        originalText: c.originalText,
        blankedText: c.blankedText,
        answers: c.answers,
      })));
    }

    return NextResponse.json({ success: true, packId: clonedPack._id });
  } catch (error) {
    console.error("Clone error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
