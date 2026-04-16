import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import Topic from "@/models/Topic";
import client from "@/lib/claude";
import { tutorChatSchema } from "@/lib/validations/focus-session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`tutor-chat:${session.user.id}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending another message." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const result = tutorChatSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-anthropic-api-key") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    await connectDB();

    const studyPack = await StudyPack.findById(result.data.studyPackId);
    if (!studyPack) {
      return NextResponse.json({ error: "Study pack not found" }, { status: 404 });
    }

    if (studyPack.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const doc = await Document.findById(studyPack.documentId);
    const truncatedText = doc?.rawText?.slice(0, 50000) || "";

    const topics = await Topic.find({ studyPackId: studyPack._id }).sort({ order: 1 });
    const topicNames = topics.map((t: any) => t.name).join(", ");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `You are a helpful study tutor. The student is studying: ${studyPack.title}. Here is the study material: ${truncatedText}. Topics covered: ${topicNames}. Help the student understand the material. Be concise, clear, and encouraging.`,
      messages: result.data.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const message = textBlock && textBlock.type === "text" ? textBlock.text : "Sorry, I could not generate a response.";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Tutor chat error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
