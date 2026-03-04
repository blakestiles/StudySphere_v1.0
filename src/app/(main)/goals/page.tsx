export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Goal from "@/models/Goal";
import StudyPack from "@/models/StudyPack";
import GoalTracker from "@/components/features/goals/GoalTracker";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const [goals, studyPacks] = await Promise.all([
    Goal.find({ userId: session.user.id }).sort({ status: 1, deadline: 1 }).lean(),
    StudyPack.find({ userId: session.user.id, status: "ready" }).select("title").lean(),
  ]);

  const serializedGoals = goals.map((g) => ({
    _id: String(g._id),
    title: g.title as string,
    description: (g.description as string) || "",
    targetType: g.targetType as string,
    targetValue: g.targetValue as number,
    currentValue: (g.currentValue as number) || 0,
    deadline: g.deadline ? (g.deadline as Date).toISOString() : undefined,
    status: g.status as string,
    aiSuggestion: (g.aiSuggestion as string) || "",
    createdAt: (g.createdAt as Date).toISOString(),
  }));

  const serializedPacks = studyPacks.map((sp) => ({
    _id: String(sp._id),
    title: sp.title as string,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Goals</h1>
        <p className="text-sm text-muted-foreground">
          Set study goals and track your progress with AI-powered suggestions
        </p>
      </div>
      <GoalTracker goals={serializedGoals} studyPacks={serializedPacks} />
    </div>
  );
}
