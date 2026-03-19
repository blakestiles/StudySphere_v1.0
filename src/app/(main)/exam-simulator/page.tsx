export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import lazyLoad from "next/dynamic";
const ExamSimulator = lazyLoad(
  () => import("@/components/features/exam/ExamSimulator"),
  { loading: () => <div className="animate-pulse h-64 rounded-xl bg-muted/40" /> }
);

export default async function ExamSimulatorPage() {
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Exam Simulator</h1>
        <p className="text-sm text-muted-foreground">
          Generate timed exams from your study materials with AI
        </p>
      </div>
      <ExamSimulator studyPacks={serializedPacks} />
    </div>
  );
}
