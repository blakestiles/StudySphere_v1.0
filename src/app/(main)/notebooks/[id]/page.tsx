
import { requireSession } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Notebook from "@/models/Notebook";
import StudyPack from "@/models/StudyPack";
import lazyLoad from "next/dynamic";
const CornellEditor = lazyLoad(
  () => import("@/components/features/notebooks/CornellEditor"),
  { loading: () => <div className="animate-pulse h-96 rounded-xl bg-muted/40" /> }
);

export default async function NotebookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();

  const { id } = await params;
  await connectDB();

  const notebook = await Notebook.findById(id).lean();
  if (!notebook || notebook.userId.toString() !== session.user.id) {
    redirect("/notebooks");
  }

  const studyPacks = await StudyPack.find({
    userId: session.user.id,
    status: "ready",
  })
    .select("title")
    .lean();

  const serializedNotebook = {
    _id: String(notebook._id),
    title: notebook.title as string,
    studyPackId: notebook.studyPackId ? String(notebook.studyPackId) : undefined,
    cues: (notebook.cues as string) || "",
    notes: (notebook.notes as string) || "",
    summary: (notebook.summary as string) || "",
  };

  const serializedPacks = studyPacks.map((sp) => ({
    _id: String(sp._id),
    title: sp.title as string,
  }));

  return (
    <div>
      <CornellEditor notebook={serializedNotebook} studyPacks={serializedPacks} />
    </div>
  );
}
