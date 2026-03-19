import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import ChatMessage from "@/models/ChatMessage";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import Topic from "@/models/Topic";
import client from "@/lib/claude";
import { sendMessageSchema } from "@/lib/validations/chat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const thread = await ChatThread.findById(id);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (String(thread.userId) !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const messages = await ChatMessage.find({ threadId: id })
      .sort({ createdAt: 1 })
      .lean();

    const serialized = messages.map((m) => ({
      _id: String(m._id),
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt).toISOString(),
    }));

    return NextResponse.json({ messages: serialized });
  } catch (error) {
    console.error("Get chat messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const thread = await ChatThread.findById(id);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (String(thread.userId) !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Load study pack context if available
    let contextText = "";
    let packTitle = "";
    let topicNames: string[] = [];

    if (thread.studyPackId) {
      const studyPack = await StudyPack.findById(thread.studyPackId).lean();
      if (studyPack) {
        packTitle = studyPack.title as string;
        const [doc, topics] = await Promise.all([
          Document.findById(studyPack.documentId).lean(),
          Topic.find({ studyPackId: thread.studyPackId }).select("name").lean(),
        ]);
        if (doc) {
          contextText = (doc.rawText as string).slice(0, 60000);
        }
        topicNames = topics.map((t) => t.name as string);
      }
    }

    // Load previous messages for context
    const previousMessages = await ChatMessage.find({ threadId: id })
      .sort({ createdAt: 1 })
      .lean();

    // Save user message
    const userMessage = await ChatMessage.create({
      threadId: id,
      role: "user",
      content: result.data.content,
    });

    // Build system prompt
    let systemPrompt = "You are a helpful study tutor.";
    if (packTitle) {
      systemPrompt += ` The student is studying: ${packTitle}.`;
      if (topicNames.length > 0) {
        systemPrompt += ` Topics: ${topicNames.join(", ")}.`;
      }
      if (contextText) {
        systemPrompt += ` Study material: ${contextText}`;
      }
    }
    if (result.data.eli5) {
      systemPrompt += " Explain everything as if the student is 5 years old. Use simple words, analogies, and relatable examples.";
    }

    // Build message history for Claude
    const claudeMessages = previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }));
    claudeMessages.push({ role: "user", content: result.data.content });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const assistantContent = textBlock && textBlock.type === "text" ? textBlock.text : "I could not generate a response.";

    // Save assistant message
    const assistantMessage = await ChatMessage.create({
      threadId: id,
      role: "assistant",
      content: assistantContent,
    });

    // Update thread
    const isFirstMessage = previousMessages.length === 0;
    thread.updatedAt = new Date();
    if (isFirstMessage) {
      thread.title = result.data.content.slice(0, 50);
    }
    await thread.save();

    return NextResponse.json({
      message: {
        _id: String(assistantMessage._id),
        role: "assistant",
        content: assistantContent,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Send chat message error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
