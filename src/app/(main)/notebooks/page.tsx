import NotebooksShell from "@/components/features/notebooks/NotebooksShell";
import { requireSession } from "@/lib/auth-cache";
import { getCachedNotebooksData } from "@/lib/data-cache";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";
import WordRotate from "@/components/ui/word-rotate";

export default async function NotebooksPage() {
  const session = await requireSession();
  const { notebooks } = await getCachedNotebooksData(session.user.id);

  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="text-2xl font-bold">Notebooks</TextShimmer>
          <WordRotate
            words={["Cornell-style notes", "Organize your thoughts", "AI-powered note taking", "Structure your learning"]}
            className="text-sm text-muted-foreground"
          />
        </div>
        <NotebooksShell notebooks={notebooks} />
      </div>
    </BlurFade>
  );
}
