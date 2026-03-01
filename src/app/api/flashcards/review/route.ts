import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Flashcard from "@/models/Flashcard";
import StudyPack from "@/models/StudyPack";
import { reviewFlashcardSchema } from "@/lib/validations/flashcard";

function computeSM2(
  rating: "again" | "hard" | "good" | "easy",
  currentEase: number,
  currentInterval: number,
  currentReps: number
) {
  let ease = currentEase;
  let interval = currentInterval;
  let reps = currentReps;

  switch (rating) {
    case "again": // rating 0
      reps = 0;
      interval = 1;
      // ease stays, but enforce minimum
      break;
    case "hard": // rating 3
      reps += 1;
      interval = Math.max(1, Math.round(interval * 1.2));
      ease -= 0.15;
      break;
    case "good": // rating 4
      reps += 1;
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 6;
      else interval = Math.round(interval * ease);
      // ease unchanged
      break;
    case "easy": // rating 5
      reps += 1;
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 6;
      else interval = Math.round(interval * ease);
      ease += 0.15;
      break;
  }

  // Enforce minimum ease factor
  if (ease < 1.3) ease = 1.3;

  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return { easeFactor: ease, intervalDays: interval, repetitions: reps, nextReviewAt, lastSeenAt: now };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = reviewFlashcardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const flashcard = await Flashcard.findById(result.data.flashcardId);
    if (!flashcard) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    // Verify ownership via study pack
    const studyPack = await StudyPack.findById(flashcard.studyPackId);
    if (!studyPack || String(studyPack.userId) !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sm2 = computeSM2(
      result.data.rating,
      flashcard.easeFactor || 2.5,
      flashcard.intervalDays || 0,
      flashcard.repetitions || 0
    );

    flashcard.easeFactor = sm2.easeFactor;
    flashcard.intervalDays = sm2.intervalDays;
    flashcard.repetitions = sm2.repetitions;
    flashcard.nextReviewAt = sm2.nextReviewAt;
    flashcard.lastSeenAt = sm2.lastSeenAt;
    await flashcard.save();

    return NextResponse.json({ flashcard });
  } catch (error) {
    console.error("Review flashcard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
