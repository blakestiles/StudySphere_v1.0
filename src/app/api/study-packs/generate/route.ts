import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { TAGS } from "@/lib/data-cache";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import ClozeQuestion from "@/models/ClozeQuestion";
import { generateStudyPackSchema } from "@/lib/validations/study-pack";
import { generateStudyPack } from "@/lib/study-pack-generator";

export async function POST(request: Request) {
  let studyPack: any = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = generateStudyPackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const doc = await Document.findById(result.data.documentId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (doc.status !== "ready") {
      return NextResponse.json({ error: "Document is not ready for processing" }, { status: 400 });
    }

    studyPack = await StudyPack.create({
      userId: session.user.id,
      documentId: doc._id,
      title: doc.title,
      status: "generating",
    });

    const generated = await generateStudyPack(doc.title, doc.rawText);

    // Create topics and collect their IDs
    const topicDocs = await Topic.insertMany(
      generated.topics.map((t) => ({
        studyPackId: studyPack._id,
        name: t.name,
        content: t.content,
        order: t.order,
      }))
    );

    // Create flashcards, quiz questions, and cloze questions for each topic
    const flashcardsToInsert: any[] = [];
    const quizQuestionsToInsert: any[] = [];
    const clozeQuestionsToInsert: any[] = [];

    generated.topics.forEach((t, i) => {
      const topicId = topicDocs[i]._id;

      for (const fc of t.flashcards) {
        flashcardsToInsert.push({
          studyPackId: studyPack._id,
          topicId,
          question: fc.question,
          answer: fc.answer,
          difficulty: fc.difficulty,
        });
      }

      for (const qq of t.quizQuestions) {
        quizQuestionsToInsert.push({
          studyPackId: studyPack._id,
          topicId,
          question: qq.question,
          options: qq.options,
          correctAnswer: qq.correctAnswer,
          explanation: qq.explanation,
        });
      }

      if (t.clozeQuestions) {
        for (const cq of t.clozeQuestions) {
          clozeQuestionsToInsert.push({
            studyPackId: studyPack._id,
            topicId,
            originalText: cq.originalText,
            blankedText: cq.blankedText,
            answers: cq.answers,
          });
        }
      }
    });

    await Promise.all([
      flashcardsToInsert.length > 0 ? Flashcard.insertMany(flashcardsToInsert) : Promise.resolve(),
      quizQuestionsToInsert.length > 0 ? QuizQuestion.insertMany(quizQuestionsToInsert) : Promise.resolve(),
      clozeQuestionsToInsert.length > 0 ? ClozeQuestion.insertMany(clozeQuestionsToInsert) : Promise.resolve(),
    ]);

    studyPack.status = "ready";
    studyPack.summaries = generated.summaries;
    studyPack.mindMap = generated.mindMap || null;
    await studyPack.save();

    revalidateTag(TAGS.studyPacks(session.user.id));
    revalidateTag(TAGS.dashboard(session.user.id));
    return NextResponse.json({ studyPack }, { status: 201 });
  } catch (error) {
    console.error("Study pack generation error:", error);

    if (studyPack) {
      try {
        studyPack.status = "error";
        await studyPack.save();
      } catch {
        // ignore save error
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
