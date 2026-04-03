import NotebooksShell from "@/components/features/notebooks/NotebooksShell";
import { requireSession } from "@/lib/auth-cache";
import { getCachedNotebooksData } from "@/lib/data-cache";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function NotebooksPage() {
  const session = await requireSession();
  const { notebooks } = await getCachedNotebooksData(session.user.id);

  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Notebooks</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">Your Cornell notes and study journals</p>
      </div>
      <NotebooksShell notebooks={notebooks} />
    </div>
  );
}
