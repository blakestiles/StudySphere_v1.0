import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Notebook from "@/models/Notebook";
import { createNotebookSchema } from "@/lib/validations/notebook";
import { TAGS } from "@/lib/data-cache";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const studyPackId = searchParams.get("studyPackId");

    const filter: Record<string, unknown> = { userId: session.user.id };
    if (studyPackId) filter.studyPackId = studyPackId;

    const notebooks = await Notebook.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error("Notebooks fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createNotebookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const notebook = await Notebook.create({
      userId: session.user.id,
      title: result.data.title || "Untitled Notebook",
      studyPackId: result.data.studyPackId || undefined,
    });

    revalidateTag(TAGS.notebooks(session.user.id), "");
    return NextResponse.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error("Notebook create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
