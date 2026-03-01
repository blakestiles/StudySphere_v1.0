import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Annotation from "@/models/Annotation";

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

    await connectDB();

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
