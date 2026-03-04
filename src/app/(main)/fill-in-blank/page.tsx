export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import FillInBlank from "@/components/features/cloze/FillInBlank";

export default async function FillInBlankPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Fill in the Blank</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated cloze questions to test your understanding of key concepts
        </p>
      </div>
      <FillInBlank studyPacks={serializedPacks} />
    </div>
  );
}
