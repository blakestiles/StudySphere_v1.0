export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import StudyPlanGenerator from "@/components/features/calendar/StudyPlanGenerator";

export default async function StudyPlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const studyPacks = await StudyPack.find({
    userId: session.user.id,
    status: "ready",
  })
    .select("title")
    .lean();

  const serializedPacks = studyPacks.map((sp) => ({
    _id: String(sp._id),
    title: sp.title as string,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Study Plan</h1>
        <p className="text-sm text-muted-foreground">
          Generate a personalized day-by-day study schedule tailored to your goals
        </p>
      </div>
      <StudyPlanGenerator studyPacks={serializedPacks} />
    </div>
  );
}
