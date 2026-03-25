import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  await connectDB();

  const pack = await StudyPack.findById(id).lean();
  if (!pack || String(pack.userId) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [topics, flashcards] = await Promise.all([
    Topic.find({ studyPackId: id }).sort({ order: 1 }).lean(),
    Flashcard.find({ studyPackId: id }).lean(),
  ]);

  const safeTitle = (pack.title as string).replace(/[^a-z0-9\-_ ]/gi, "").trim() || "flashcards";

  if (format === "csv") {
    const rows = ["Question,Answer,Difficulty"];
    for (const f of flashcards) {
      rows.push(
        `${csvEscape(f.question as string)},${csvEscape(f.answer as string)},${csvEscape(f.difficulty as string)}`
      );
    }
    const body = rows.join("\r\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}-flashcards.csv"`,
      },
    });
  }

  // text format
  const lines: string[] = [];
  lines.push(pack.title as string);
  lines.push("=".repeat((pack.title as string).length));
  lines.push("");

  const summaries = pack.summaries as { short?: string; detailed?: string };
  if (summaries?.short) {
    lines.push(summaries.short);
    lines.push("");
  }

  // Build topicId -> topic name map
  const topicMap = new Map(topics.map((t) => [String(t._id), t.name as string]));

  // Group flashcards by topic
  const byTopic = new Map<string, typeof flashcards>();
  const noTopic: typeof flashcards = [];
  for (const f of flashcards) {
    const tid = f.topicId ? String(f.topicId) : null;
    if (tid && topicMap.has(tid)) {
      if (!byTopic.has(tid)) byTopic.set(tid, []);
      byTopic.get(tid)!.push(f);
    } else {
      noTopic.push(f);
    }
  }

  for (const topic of topics) {
    const tid = String(topic._id);
    const cards = byTopic.get(tid);
    if (!cards || cards.length === 0) continue;
    lines.push(`## ${topic.name as string}`);
    lines.push("");
    for (const f of cards) {
      lines.push(`Q: ${f.question as string}`);
      lines.push(`A: ${f.answer as string}`);
      lines.push("");
    }
  }

  if (noTopic.length > 0) {
    if (topics.length > 0) {
      lines.push("## General");
      lines.push("");
    }
    for (const f of noTopic) {
      lines.push(`Q: ${f.question as string}`);
      lines.push(`A: ${f.answer as string}`);
      lines.push("");
    }
  }

  const body = lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}-flashcards.txt"`,
    },
  });
}
