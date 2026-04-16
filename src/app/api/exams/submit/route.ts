import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ExamAttempt from "@/models/ExamAttempt";
import StudyPack from "@/models/StudyPack";
import { submitExamSchema } from "@/lib/validations/exam";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = submitExamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { examId, studyPackId, responses, timeTaken, proctored } = result.data;

    // Verify study pack ownership
    const pack = await StudyPack.findById(studyPackId).lean();
    if (!pack || String(pack.userId) !== session.user.id) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    // Load server-stored questions (tamper-proof)
    const pending = await ExamAttempt.findOne({
      _id: examId,
      userId: session.user.id,
      status: "pending",
    });
    if (!pending) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Verify studyPackId matches the pending exam
    if (String(pending.studyPackId) !== studyPackId) {
      return NextResponse.json({ error: "Study pack mismatch" }, { status: 400 });
    }

    const questions = pending.questions;

    // Deduplicate responses — only first answer per questionIndex counts
    const seenIndexes = new Set<number>();
    const uniqueResponses = responses.filter((r) => {
      if (seenIndexes.has(r.questionIndex)) return false;
      seenIndexes.add(r.questionIndex);
      return true;
    });

    const score = uniqueResponses.reduce((count, r) => {
      const q = questions[r.questionIndex];
      if (!q) return count;
      return count + (r.selectedAnswer === q.correctAnswer ? 1 : 0);
    }, 0);

    pending.responses = uniqueResponses.map((r) => ({
      ...r,
      isCorrect: questions[r.questionIndex]
        ? r.selectedAnswer === questions[r.questionIndex].correctAnswer
        : false,
    }));
    pending.score = score;
    pending.timeTaken = timeTaken;
    pending.proctored = proctored;
    pending.status = "completed";
    pending.completedAt = new Date();
    await pending.save();

    return NextResponse.json({ attempt: pending }, { status: 201 });
  } catch (error) {
    console.error("Exam submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
