import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Reminder from "@/models/Reminder";
import { markReadSchema } from "@/lib/validations/reminder";

export async function PATCH(
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
    const result = markReadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await connectDB();

    const reminder = await Reminder.findById(id);
    if (!reminder || reminder.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    reminder.read = result.data.read;
    await reminder.save();

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error("Reminder update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
