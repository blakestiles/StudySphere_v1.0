import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import StudyEvent from "@/models/StudyEvent";
import client from "@/lib/claude";
import { generateStudyPlanSchema } from "@/lib/validations/study-event";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`study-plan:${session.user.id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const parsed = generateStudyPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }

    const { studyPackIds, intensity, preferredTime, targetDate } = parsed.data;

    await connectDB();

    const studyPacks = await StudyPack.find({
      _id: { $in: studyPackIds },
      userId: session.user.id,
      status: "ready",
    }).lean();

    if (studyPacks.length === 0) {
      return NextResponse.json({ error: "No valid study packs found" }, { status: 400 });
    }

    const topics = await Topic.find({
      studyPackId: { $in: studyPacks.map((sp) => sp._id) },
    })
      .select("studyPackId name")
      .lean();

    const packSummaries = studyPacks.map((sp) => {
      const packTopics = topics.filter(
        (t) => t.studyPackId.toString() === sp._id.toString()
      );
      return {
        title: sp.title,
        topics: packTopics.map((t) => t.name),
      };
    });

    const sessionsPerDay =
      intensity === "relaxed" ? "1-2" : intensity === "balanced" ? "2-3" : "3-5";

    const timeRanges: Record<string, string> = {
      morning: "08:00-12:00",
      afternoon: "12:00-17:00",
      evening: "17:00-22:00",
    };

    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are a study planner. Create a study schedule based on the following:

Study Packs and Topics:
${packSummaries.map((sp) => `- "${sp.title}": ${sp.topics.join(", ")}`).join("\n")}

Settings:
- Intensity: ${intensity} (${sessionsPerDay} sessions per day)
- Preferred time: ${preferredTime} (${timeRanges[preferredTime]})
- Start date: ${today}
- Target/deadline date: ${targetDate}
- Session duration: 30-60 minutes each

Create a balanced study plan that covers all topics across all study packs. Space out topics for spaced repetition. Assign different colors to different study packs from these options: #3b82f6 (blue), #22c55e (green), #8b5cf6 (purple), #f97316 (orange), #ec4899 (pink), #ef4444 (red).

Return ONLY a JSON array (no markdown, no explanation) of events:
[{"title": "Study: Topic Name", "description": "Brief description of what to focus on", "date": "YYYY-MM-DD", "startTime": "HH:mm", "duration": 30, "color": "#hex", "studyPackTitle": "Exact pack title"}]`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let events: Array<{
      title: string;
      description: string;
      date: string;
      startTime: string;
      duration: number;
      color: string;
      studyPackTitle: string;
    }>;

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      events = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse Claude response:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Map studyPackTitle to actual studyPackId
    const titleToId = new Map(
      studyPacks.map((sp) => [sp.title, sp._id.toString()])
    );

    // Insert new events first, then delete old ones (safe ordering)
    const eventDocs = events.map((e) => ({
      userId: session.user.id,
      studyPackId: titleToId.get(e.studyPackTitle) || undefined,
      title: e.title,
      description: e.description || "",
      date: new Date(e.date),
      startTime: e.startTime,
      duration: e.duration || 30,
      color: e.color || "#3b82f6",
      completed: false,
      isAiGenerated: true,
    }));

    const created = await StudyEvent.insertMany(eventDocs);

    // Delete old AI-generated events (exclude the ones we just created)
    await StudyEvent.deleteMany({
      userId: session.user.id,
      isAiGenerated: true,
      _id: { $nin: created.map((e) => e._id) },
    });

    return NextResponse.json({
      success: true,
      count: created.length,
      events: created,
    });
  } catch (error) {
    console.error("Study plan generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
