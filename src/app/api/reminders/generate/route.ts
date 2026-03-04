import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Reminder from "@/models/Reminder";
import Flashcard from "@/models/Flashcard";
import StudyPack from "@/models/StudyPack";
import StudyEvent from "@/models/StudyEvent";
import ReviewStats from "@/models/ReviewStats";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    let createdCount = 0;

    // 1. Find overdue flashcards
    const userPacks = await StudyPack.find({ userId: session.user.id }).select("_id title").lean();
    const packIds = userPacks.map((p) => p._id);

    if (packIds.length > 0) {
      const overdueCards = await Flashcard.find({
        studyPackId: { $in: packIds },
        nextReviewAt: { $lt: now },
      })
        .limit(10)
        .lean();

      for (const card of overdueCards) {
        const existing = await Reminder.findOne({
          userId: session.user.id,
          type: "review_due",
          relatedId: card._id,
          createdAt: { $gte: oneDayAgo },
        });
        if (!existing) {
          const pack = userPacks.find((p) => p._id.toString() === card.studyPackId.toString());
          await Reminder.create({
            userId: session.user.id,
            type: "review_due",
            message: `Flashcard overdue for review: "${(card.question as string).slice(0, 60)}..." from ${pack?.title || "a study pack"}`,
            triggerDate: now,
            relatedId: card._id,
            relatedModel: "Flashcard",
          });
          createdCount++;
        }
      }
    }

    // 2. Find upcoming calendar events (within 3 days)
    const upcomingEvents = await StudyEvent.find({
      userId: session.user.id,
      date: { $gte: now, $lte: threeDaysFromNow },
      completed: false,
    })
      .limit(10)
      .lean();

    for (const event of upcomingEvents) {
      const existing = await Reminder.findOne({
        userId: session.user.id,
        type: "exam_countdown",
        relatedId: event._id,
        createdAt: { $gte: oneDayAgo },
      });
      if (!existing) {
        const daysUntil = Math.ceil(
          ((event.date as Date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        await Reminder.create({
          userId: session.user.id,
          type: "exam_countdown",
          message: `"${event.title}" is coming up in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}!`,
          triggerDate: now,
          relatedId: event._id,
          relatedModel: "StudyEvent",
        });
        createdCount++;
      }
    }

    // 3. Find inactive topics (no study activity in 3+ days)
    const recentStats = await ReviewStats.find({
      userId: session.user.id,
      date: { $gte: threeDaysAgo },
      cardsReviewed: { $gt: 0 },
    }).lean();

    if (recentStats.length === 0 && packIds.length > 0) {
      const existing = await Reminder.findOne({
        userId: session.user.id,
        type: "inactive_topic",
        createdAt: { $gte: oneDayAgo },
      });
      if (!existing) {
        await Reminder.create({
          userId: session.user.id,
          type: "inactive_topic",
          message: "You haven't studied in 3+ days. Time to get back on track!",
          triggerDate: now,
        });
        createdCount++;
      }
    }

    return NextResponse.json({ created: createdCount });
  } catch (error) {
    console.error("Reminder generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
