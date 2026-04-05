import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import { extractTextWithPageMarkers } from "@/lib/pdf";
import { TAGS } from "@/lib/data-cache";
import client from "@/lib/claude";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // PDF upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
      }

      const isImage = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
      const isPDF = file.type === "application/pdf";

      if (!isImage && !isPDF) {
        return NextResponse.json({ error: "Only PDF or image files are supported" }, { status: 400 });
      }

      let rawText = "";

      if (isPDF) {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Validate PDF magic bytes — file.type is client-provided and spoofable
        if (!buffer.slice(0, 5).toString("ascii").startsWith("%PDF-")) {
          return NextResponse.json({ error: "File does not appear to be a valid PDF" }, { status: 400 });
        }

        rawText = await extractTextWithPageMarkers(buffer);

        if (!rawText || rawText.trim().length === 0) {
          return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
        }

        const title = formData.get("title") as string || file.name.replace(".pdf", "");

        const doc = await Document.create({
          userId: session.user.id,
          title,
          originalFilename: file.name,
          fileType: "pdf",
          rawText,
          status: "ready",
        });

        revalidateTag(TAGS.documents(session.user.id), "");
        revalidateTag(TAGS.dashboard(session.user.id), "");
        return NextResponse.json(
          { message: "Document uploaded successfully", document: doc },
          { status: 201 }
        );
      }

      if (isImage) {
        const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

        const visionResponse = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: "Extract all text from this image. If it contains handwritten notes, diagrams with labels, or printed text, transcribe everything accurately. Return only the extracted text, no commentary.",
              },
            ],
          }],
        });

        const textBlock = visionResponse.content.find(b => b.type === "text");
        rawText = textBlock?.type === "text" ? textBlock.text : "";

        if (!rawText.trim()) {
          return NextResponse.json({ error: "Could not extract text from image" }, { status: 400 });
        }

        const title = formData.get("title") as string || file.name.replace(/\.[^.]+$/, "");
        const doc = await Document.create({
          userId: session.user.id, title,
          originalFilename: file.name, fileType: "image",
          rawText, status: "ready",
        });
        revalidateTag(TAGS.documents(session.user.id), "");
        revalidateTag(TAGS.dashboard(session.user.id), "");
        return NextResponse.json({ message: "Image processed successfully", document: doc }, { status: 201 });
      }
    } else {
      // Text paste
      const { title, content } = await request.json();

      if (!title || !content) {
        return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
      }

      if (content.length < 10) {
        return NextResponse.json({ error: "Content must be at least 10 characters" }, { status: 400 });
      }

      const MAX_TEXT_SIZE = 500_000; // ~500KB of plain text
      if (content.length > MAX_TEXT_SIZE) {
        return NextResponse.json({ error: "Content too large. Maximum 500,000 characters" }, { status: 400 });
      }

      const doc = await Document.create({
        userId: session.user.id,
        title,
        fileType: "text",
        rawText: content,
        status: "ready",
      });

      revalidateTag(TAGS.documents(session.user.id), "");
      revalidateTag(TAGS.dashboard(session.user.id), "");
      return NextResponse.json(
        { message: "Document created successfully", document: doc },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
