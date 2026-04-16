import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Annotation from "@/models/Annotation";
import Document from "@/models/Document";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = req.nextUrl.searchParams.get("documentId");
    if (!documentId) {
      return NextResponse.json(
        { error: "documentId query parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const annotations = await Annotation.find({
      userId: session.user.id,
      documentId,
    }).sort({ startOffset: 1 });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Annotations GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, type, color, startOffset, endOffset, selectedText, noteText } =
      body;

    if (!documentId || startOffset == null || endOffset == null) {
      return NextResponse.json(
        { error: "documentId, startOffset, and endOffset are required" },
        { status: 400 }
      );
    }

    if (typeof startOffset !== "number" || typeof endOffset !== "number" ||
        startOffset < 0 || endOffset < 0 || endOffset < startOffset) {
      return NextResponse.json({ error: "Invalid offset values" }, { status: 400 });
    }

    if (typeof selectedText === "string" && selectedText.length > 10000) {
      return NextResponse.json({ error: "selectedText too long" }, { status: 400 });
    }
    if (typeof noteText === "string" && noteText.length > 10000) {
      return NextResponse.json({ error: "noteText too long" }, { status: 400 });
    }

    await connectDB();

    // Verify document ownership
    const doc = await Document.findOne({ _id: documentId, userId: session.user.id }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const annotation = await Annotation.create({
      userId: session.user.id,
      documentId,
      type: type || "highlight",
      color: color || "#fbbf24",
      startOffset,
      endOffset,
      selectedText: selectedText || "",
      noteText: noteText || "",
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Annotations POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
