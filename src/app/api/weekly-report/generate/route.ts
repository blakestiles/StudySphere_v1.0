import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import { TAGS } from "@/lib/data-cache";
import { startOfWeek, endOfWeek } from "date-fns";
import FocusSession from "@/models/FocusSession";
import QuizAttempt from "@/models/QuizAttempt";
import ReviewStats from "@/models/ReviewStats";
import EssayAttempt from "@/models/EssayAttempt";
import WeakArea from "@/models/WeakArea";
import WeeklyReport from "@/models/WeeklyReport";
import Topic from "@/models/Topic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

    // Check if report already exists for this week
    const existing = await WeeklyReport.findOne({
      userId: session.user.id,
      weekStart,
      weekEnd,
    }).lean();

    if (existing) {
      return NextResponse.json({ report: existing });
    }

    const userId = session.user.id;

    // Aggregate last 7 days of data
    const [focusSessions, quizAttempts, reviewStats, essayAttempts, weakAreas] =
      await Promise.all([
        FocusSession.find({
          userId,
          createdAt: { $gte: weekStart, $lte: weekEnd },
        }).lean(),
        QuizAttempt.find({
          userId,
          completedAt: { $gte: weekStart, $lte: weekEnd },
        }).lean(),
        ReviewStats.find({
          userId,
          date: { $gte: weekStart, $lte: weekEnd },
        }).lean(),
        EssayAttempt.find({
          userId,
          completedAt: { $gte: weekStart, $lte: weekEnd },
        }).lean(),
        WeakArea.find({ userId }).populate("topicId").limit(5).lean(),
      ]);

    // Calculate stats
    const studyMinutes = focusSessions.reduce(
      (sum, s) => sum + (Number(s.duration) || 0),
      0
    );
    const quizzesTaken = quizAttempts.length;
    const avgScore =
      quizzesTaken > 0
        ? Math.round(
            (quizAttempts.reduce(
              (sum, q) =>
                sum + (Number(q.score) / Number(q.totalQuestions)) * 100,
              0
            ) /
              quizzesTaken) *
              10
          ) / 10
        : 0;
    const cardsReviewed = reviewStats.reduce(
      (sum, r) => sum + (Number(r.cardsReviewed) || 0),
      0
    );
    const essaysWritten = essayAttempts.length;

    const weakAreaNames = weakAreas
      .map((w) => {
        const topic = w.topicId as { name?: string } | null;
        return topic?.name ?? "Unknown";
      });

    const statsData = {
      studyMinutes,
      quizzesTaken,
      avgScore,
      cardsReviewed,
      essaysWritten,
    };

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are an academic performance analyst. Analyze this student's weekly study data and provide actionable insights. Return ONLY valid JSON with no extra text, in this exact format:
{
  "summary": "A 2-3 sentence overview of the student's week",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}`,
      messages: [
        {
          role: "user",
          content: `Weekly Study Data:
- Study Minutes: ${studyMinutes}
- Quizzes Taken: ${quizzesTaken}
- Average Quiz Score: ${avgScore}%
- Flashcards Reviewed: ${cardsReviewed}
- Essays Written: ${essaysWritten}
- Weak Areas: ${weakAreaNames.join(", ") || "None identified"}
- Focus Sessions: ${focusSessions.length}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Claude response:", responseText);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    let analysis: { summary?: string; strengths?: string[]; weaknesses?: string[]; recommendations?: string[] };
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse Claude response as JSON:", responseText);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const report = await WeeklyReport.create({
      userId,
      weekStart,
      weekEnd,
      summary: analysis.summary,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
      stats: statsData,
    });

    revalidateTag(TAGS.reports(session.user.id));
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Weekly report generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
