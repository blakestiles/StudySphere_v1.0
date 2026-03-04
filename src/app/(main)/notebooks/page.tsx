export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Notebook from "@/models/Notebook";
import StudyPack from "@/models/StudyPack";
import NotebookList from "@/components/features/notebooks/NotebookList";

export default async function NotebooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const [notebooks, studyPacks] = await Promise.all([
    Notebook.find({ userId: session.user.id }).sort({ updatedAt: -1 }).lean(),
    StudyPack.find({ userId: session.user.id, status: "ready" }).select("title").lean(),
  ]);

  const serializedNotebooks = notebooks.map((n) => ({
    _id: String(n._id),
    title: n.title as string,
    studyPackId: n.studyPackId ? String(n.studyPackId) : undefined,
    updatedAt: (n.updatedAt as Date).toISOString(),
  }));

  const serializedPacks = studyPacks.map((sp) => ({
    _id: String(sp._id),
    title: sp.title as string,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notebooks</h1>
        <p className="text-sm text-muted-foreground">
          Take Cornell-style notes to organize your studying
        </p>
      </div>
      <NotebookList notebooks={serializedNotebooks} studyPacks={serializedPacks} />
    </div>
  );
}
