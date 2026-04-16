import { NextRequest, NextResponse } from "next/server";
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
import Annotation from "@/models/Annotation";
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const document = await Document.findById(id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const document = await Document.findById(id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find related study packs to cascade delete their children
    const studyPacks = await StudyPack.find({ documentId: id, userId: session.user.id }).select("_id");
    const studyPackIds = studyPacks.map((sp: { _id: unknown }) => sp._id);

    if (studyPackIds.length > 0) {
      // Collect IDs for cascading deletes
      const [threads, topics] = await Promise.all([
        ChatThread.find({ studyPackId: { $in: studyPackIds } }).select("_id").lean(),
        Topic.find({ studyPackId: { $in: studyPackIds } }).select("_id").lean(),
      ]);
      const threadIds = threads.map((t) => t._id);
      const topicIds = topics.map((t) => t._id);

      await Promise.all([
        Topic.deleteMany({ studyPackId: { $in: studyPackIds } }),
        Flashcard.deleteMany({ studyPackId: { $in: studyPackIds } }),
        QuizQuestion.deleteMany({ studyPackId: { $in: studyPackIds } }),
        ClozeQuestion.deleteMany({ studyPackId: { $in: studyPackIds } }),
        QuizAttempt.deleteMany({ studyPackId: { $in: studyPackIds } }),
        ExamAttempt.deleteMany({ studyPackId: { $in: studyPackIds } }),
        FocusSession.deleteMany({ studyPackId: { $in: studyPackIds } }),
        StudyEvent.deleteMany({ studyPackId: { $in: studyPackIds } }),
        EssayAttempt.deleteMany({ studyPackId: { $in: studyPackIds } }),
        CheatSheet.deleteMany({ studyPackId: { $in: studyPackIds } }),
        Notebook.deleteMany({ studyPackId: { $in: studyPackIds } }),
        ChatThread.deleteMany({ studyPackId: { $in: studyPackIds } }),
        ...(threadIds.length > 0 ? [ChatMessage.deleteMany({ threadId: { $in: threadIds } })] : []),
        ...(topicIds.length > 0 ? [WeakArea.deleteMany({ topicId: { $in: topicIds } })] : []),
      ]);
      await StudyPack.deleteMany({ documentId: id, userId: session.user.id });
    }

    await Promise.all([
      Annotation.deleteMany({ documentId: id, userId: session.user.id }),
      Document.findByIdAndDelete(id),
    ]);

    revalidateTag(TAGS.documents(session.user.id), "");
    revalidateTag(TAGS.dashboard(session.user.id), "");
    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
