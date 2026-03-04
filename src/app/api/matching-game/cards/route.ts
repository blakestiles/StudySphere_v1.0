import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Flashcard from "@/models/Flashcard";
import StudyPack from "@/models/StudyPack";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studyPackId = searchParams.get("studyPackId");
    const count = parseInt(searchParams.get("count") || "8", 10);

    if (!studyPackId) {
      return NextResponse.json(
        { error: "studyPackId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user owns the study pack
    const pack = await StudyPack.findById(studyPackId);
    if (!pack || pack.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Study pack not found" },
        { status: 404 }
      );
    }

    const cards = await Flashcard.aggregate([
      { $match: { studyPackId: new mongoose.Types.ObjectId(studyPackId) } },
      { $sample: { size: count } },
      { $project: { _id: 1, question: 1, answer: 1 } },
    ]);

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Matching game cards error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
