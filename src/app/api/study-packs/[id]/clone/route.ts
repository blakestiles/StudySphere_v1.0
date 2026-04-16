import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import ClozeQuestion from "@/models/ClozeQuestion";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const pack = await StudyPack.findOne({ _id: id, isPublic: true }).lean();
  if (!pack) {
    return NextResponse.json({ error: "Not found or not public" }, { status: 404 });
  }

  const alreadyCloned = await StudyPack.findOne({ userId: session.user.id, clonedFrom: pack._id });
  if (alreadyCloned) {
    return NextResponse.json({ studyPack: { _id: String(alreadyCloned._id), title: alreadyCloned.title } });
  }

  const [topics, flashcards, quizQuestions, clozeQuestions] = await Promise.all([
    Topic.find({ studyPackId: id }).lean(),
    Flashcard.find({ studyPackId: id }).lean(),
    QuizQuestion.find({ studyPackId: id }).lean(),
    ClozeQuestion.find({ studyPackId: id }).lean(),
  ]);

  const clonedDoc = await Document.create({
    userId: session.user.id,
    title: `${pack.title} (Cloned)`,
    fileType: "text",
    rawText: `Cloned from shared pack: ${pack.title}`,
    status: "ready",
  });

  const newPack = await StudyPack.create({
    userId: session.user.id,
    documentId: clonedDoc._id,
    title: pack.title,
    summaries: pack.summaries,
    mindMap: (pack as any).mindMap || null,
    status: "ready",
    isPublic: false,
    clonedFrom: pack._id,
  });

  // Map old topicId -> new topicId
  const topicIdMap = new Map<string, string>();

  if (topics.length > 0) {
    const newTopics = await Topic.insertMany(
      topics.map((t) => ({
        studyPackId: newPack._id,
        name: t.name,
        content: t.content,
        order: t.order,
      }))
    );
    topics.forEach((t, i) => {
      topicIdMap.set(String(t._id), String(newTopics[i]._id));
    });
    // Remap parentTopicId to cloned IDs
    const bulkOps = newTopics
      .map((nt, i) => {
        const oldParent = topics[i].parentTopicId;
        if (!oldParent) return null;
        const newParent = topicIdMap.get(String(oldParent));
        if (!newParent) return null;
        return { updateOne: { filter: { _id: nt._id }, update: { $set: { parentTopicId: newParent } } } };
      })
      .filter(Boolean);
    if (bulkOps.length > 0) await Topic.bulkWrite(bulkOps as any);
  }

  if (flashcards.length > 0) {
    await Flashcard.insertMany(
      flashcards.map((f) => ({
        studyPackId: newPack._id,
        topicId: f.topicId ? topicIdMap.get(String(f.topicId)) : undefined,
        question: f.question,
        answer: f.answer,
        difficulty: f.difficulty,
      }))
    );
  }

  if (quizQuestions.length > 0) {
    await QuizQuestion.insertMany(
      quizQuestions.map((q) => ({
        studyPackId: newPack._id,
        topicId: q.topicId ? topicIdMap.get(String(q.topicId)) : undefined,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }))
    );
  }

  if (clozeQuestions.length > 0) {
    await ClozeQuestion.insertMany(
      clozeQuestions.map((c) => ({
        studyPackId: newPack._id,
        topicId: c.topicId ? topicIdMap.get(String(c.topicId)) : undefined,
        originalText: c.originalText,
        blankedText: c.blankedText,
        answers: c.answers,
      }))
    );
  }

  return NextResponse.json({ studyPack: { _id: String(newPack._id), title: newPack.title } });
}
