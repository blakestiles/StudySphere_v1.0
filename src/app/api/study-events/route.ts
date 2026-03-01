import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import StudyEvent from "@/models/StudyEvent";
import { createStudyEventSchema } from "@/lib/validations/study-event";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // "YYYY-MM"

    const query: Record<string, unknown> = { userId: session.user.id };

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const events = await StudyEvent.find(query)
      .sort({ date: 1, startTime: 1 })
      .populate("studyPackId", "title")
      .lean();

    return NextResponse.json(events);
  } catch (error) {
    console.error("Study events GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createStudyEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }

    await connectDB();

    const event = await StudyEvent.create({
      userId: session.user.id,
      ...parsed.data,
      date: new Date(parsed.data.date),
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Study events POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
