import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const pack = await StudyPack.findById(id);
  if (!pack || String(pack.userId) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = require("crypto").randomBytes(32).toString("hex");
  pack.shareToken = token;
  pack.isPublic = true;
  await pack.save();

  return NextResponse.json({ shareToken: token });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const pack = await StudyPack.findById(id);
  if (!pack || String(pack.userId) !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await StudyPack.updateOne({ _id: id }, { $unset: { shareToken: "" }, isPublic: false });

  return NextResponse.json({ success: true });
}
