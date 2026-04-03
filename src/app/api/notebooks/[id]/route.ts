import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Notebook from "@/models/Notebook";
import { updateNotebookSchema } from "@/lib/validations/notebook";
import { TAGS } from "@/lib/data-cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const notebook = await Notebook.findById(id).lean();
    if (!notebook || notebook.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ notebook });
  } catch (error) {
    console.error("Notebook fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateNotebookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.issues }, { status: 400 });
    }

    await connectDB();

    const notebook = await Notebook.findById(id);
    if (!notebook || notebook.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.title !== undefined) updates.title = result.data.title;
    if (result.data.cues !== undefined) updates.cues = result.data.cues;
    if (result.data.notes !== undefined) updates.notes = result.data.notes;
    if (result.data.summary !== undefined) updates.summary = result.data.summary;

    const updated = await Notebook.findByIdAndUpdate(id, updates, { new: true }).lean();

    revalidateTag(TAGS.notebooks(session.user.id), "");
    return NextResponse.json({ notebook: updated });
  } catch (error) {
    console.error("Notebook update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const notebook = await Notebook.findById(id);
    if (!notebook || notebook.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await Notebook.findByIdAndDelete(id);

    revalidateTag(TAGS.notebooks(session.user.id), "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notebook delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
