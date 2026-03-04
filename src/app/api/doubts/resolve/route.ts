import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import client from "@/lib/claude";
import StudyPack from "@/models/StudyPack";
import Document from "@/models/Document";
import DoubtResolution from "@/models/DoubtResolution";
import { resolveDoubtSchema } from "@/lib/validations/doubt";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = resolveDoubtSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { inputText, studyPackId } = result.data;

    // Build context from study pack if provided
    let contextText = "";
    if (studyPackId) {
      const pack = await StudyPack.findById(studyPackId);
      if (pack && pack.userId.toString() === session.user.id) {
        const doc = await Document.findById(pack.documentId);
        if (doc?.rawText) {
          contextText = doc.rawText.slice(0, 6000);
        }
      }
    }

    const contextSection = contextText
      ? `\n\nReference material for context:\n${contextText}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are an expert tutor. Break down this confusing text step-by-step. Use analogies, real-world examples, and simple language. Structure your response with clear numbered steps. Use markdown formatting for readability.`,
      messages: [
        {
          role: "user",
          content: `Please explain this in a clear, simple way:\n\n${inputText}${contextSection}`,
        },
      ],
    });

    const explanation =
      message.content[0].type === "text" ? message.content[0].text : "";

    const doubt = await DoubtResolution.create({
      userId: session.user.id,
      inputText,
      explanation,
      studyPackId: studyPackId || undefined,
    });

    return NextResponse.json({ doubt }, { status: 201 });
  } catch (error) {
    console.error("Doubt resolution error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
