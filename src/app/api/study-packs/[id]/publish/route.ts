import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import crypto from "crypto";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const pack = await StudyPack.findById(id);
    if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (pack.userId.toString() !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (!pack.isPublic) {
      if (!pack.shareToken) pack.shareToken = crypto.randomBytes(16).toString("hex");
      pack.isPublic = true;
    } else {
      pack.isPublic = false;
    }

    await pack.save();
    return NextResponse.json({ isPublic: pack.isPublic, shareToken: pack.shareToken });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
