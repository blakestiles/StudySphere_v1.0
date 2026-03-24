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
    const studyPacks = await StudyPack.find({ documentId: id }).select("_id");
    const studyPackIds = studyPacks.map((sp: { _id: unknown }) => sp._id);

    if (studyPackIds.length > 0) {
      await Promise.all([
        Topic.deleteMany({ studyPackId: { $in: studyPackIds } }),
        Flashcard.deleteMany({ studyPackId: { $in: studyPackIds } }),
        QuizQuestion.deleteMany({ studyPackId: { $in: studyPackIds } }),
      ]);
      await StudyPack.deleteMany({ documentId: id });
    }

    await Document.findByIdAndDelete(id);

    revalidateTag(TAGS.documents(session.user.id));
    revalidateTag(TAGS.dashboard(session.user.id));
    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
