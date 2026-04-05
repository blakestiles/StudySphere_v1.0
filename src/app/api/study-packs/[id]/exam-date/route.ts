import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { examDate } = await request.json();

    await connectDB();
    const pack = await StudyPack.findById(id);
    if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pack.userId.toString() !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    pack.examDate = examDate ? new Date(examDate) : null;
    await pack.save();

    return NextResponse.json({ success: true, examDate: pack.examDate });
  } catch (error) {
    console.error("Exam date error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
