export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import MatchingGame from "@/components/features/matching/MatchingGame";

export default async function MatchingGamePage() {
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
        <h1 className="text-2xl font-bold text-foreground">Matching Game</h1>
        <p className="text-sm text-muted-foreground">
          Match terms to their definitions to test your knowledge
        </p>
      </div>
      <MatchingGame studyPacks={serializedPacks} />
    </div>
  );
}
