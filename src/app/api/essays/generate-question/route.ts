import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`essay-question:${session.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating again." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { studyPackId } = await request.json();
    if (!studyPackId) {
      return NextResponse.json({ error: "studyPackId is required" }, { status: 400 });
    }

    await connectDB();

    const pack = await StudyPack.findById(studyPackId);
    if (!pack || pack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    const doc = await Document.findById(pack.documentId);
    const contextText = doc?.rawText?.slice(0, 6000) || "";

    const prompt = contextText
      ? `Based on the following study material, write exactly one short essay question (under 20 words). Output only the question itself, nothing else.\n\nStudy material:\n${contextText}`
      : `Write exactly one short essay question (under 20 words) about "${pack.title}". Output only the question itself, nothing else.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Take only the first line/sentence to guarantee exactly one question
    const question = raw.split("\n").filter(Boolean)[0].trim();

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Generate essay question error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
