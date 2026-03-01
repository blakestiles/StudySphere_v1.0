export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import FocusMode from "@/components/features/focus/FocusMode";

export default async function FocusPage() {
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Focus Mode</h1>
        <p className="text-sm text-muted-foreground">
          Pomodoro-powered deep work sessions
        </p>
      </div>
      <FocusMode studyPacks={serializedPacks} />
    </div>
  );
}
