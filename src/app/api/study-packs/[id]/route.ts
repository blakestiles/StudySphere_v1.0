import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const studyPack = await StudyPack.findById(id);
    if (!studyPack) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    if (studyPack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [topics, flashcards, quizQuestions] = await Promise.all([
      Topic.find({ studyPackId: id }).sort({ order: 1 }),
      Flashcard.find({ studyPackId: id }),
      QuizQuestion.find({ studyPackId: id }),
    ]);

    return NextResponse.json({ studyPack, topics, flashcards, quizQuestions });
  } catch (error) {
    console.error("Get study pack error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
