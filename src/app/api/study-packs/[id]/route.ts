import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import { TAGS } from "@/lib/data-cache";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import ClozeQuestion from "@/models/ClozeQuestion";
import QuizAttempt from "@/models/QuizAttempt";
import ExamAttempt from "@/models/ExamAttempt";
import FocusSession from "@/models/FocusSession";
import StudyEvent from "@/models/StudyEvent";
import EssayAttempt from "@/models/EssayAttempt";
import ChatThread from "@/models/ChatThread";
import ChatMessage from "@/models/ChatMessage";
import CheatSheet from "@/models/CheatSheet";
import Notebook from "@/models/Notebook";
import WeakArea from "@/models/WeakArea";

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

export async function DELETE(
  _request: Request,
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

    // Collect IDs for cascading deletes
    const [threads, topics] = await Promise.all([
      ChatThread.find({ studyPackId: id }).select("_id").lean(),
      Topic.find({ studyPackId: id }).select("_id").lean(),
    ]);
    const threadIds = threads.map((t) => t._id);
    const topicIds = topics.map((t) => t._id);

    await Promise.all([
      Topic.deleteMany({ studyPackId: id }),
      Flashcard.deleteMany({ studyPackId: id }),
      QuizQuestion.deleteMany({ studyPackId: id }),
      ClozeQuestion.deleteMany({ studyPackId: id }),
      QuizAttempt.deleteMany({ studyPackId: id }),
      ExamAttempt.deleteMany({ studyPackId: id }),
      FocusSession.deleteMany({ studyPackId: id }),
      StudyEvent.deleteMany({ studyPackId: id }),
      EssayAttempt.deleteMany({ studyPackId: id }),
      CheatSheet.deleteMany({ studyPackId: id }),
      Notebook.deleteMany({ studyPackId: id }),
      ChatThread.deleteMany({ studyPackId: id }),
      ...(threadIds.length > 0 ? [ChatMessage.deleteMany({ threadId: { $in: threadIds } })] : []),
      ...(topicIds.length > 0 ? [WeakArea.deleteMany({ topicId: { $in: topicIds } })] : []),
    ]);
    await StudyPack.findByIdAndDelete(id);

    revalidateTag(TAGS.studyPacks(session.user.id), "");
    revalidateTag(TAGS.dashboard(session.user.id), "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete study pack error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
