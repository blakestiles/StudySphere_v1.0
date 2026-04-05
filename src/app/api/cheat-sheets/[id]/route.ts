import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import CheatSheet from "@/models/CheatSheet";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const sheet = await CheatSheet.findById(id);
    if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (sheet.userId.toString() !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await CheatSheet.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cheat sheet DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
