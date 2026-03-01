export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import EssayWriter from "@/components/features/essays/EssayWriter";

export default async function PracticeEssayPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Practice Essay</h1>
        <p className="text-sm text-muted-foreground">
          Write answers and get AI feedback on accuracy, depth &amp; clarity
        </p>
      </div>
      <EssayWriter studyPacks={serializedPacks} />
    </div>
  );
}
