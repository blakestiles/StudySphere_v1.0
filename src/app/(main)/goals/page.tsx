import GoalsShell from "@/components/features/goals/GoalsShell";
import { requireSession } from "@/lib/auth-cache";
import { getCachedGoalsData } from "@/lib/data-cache";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";
import WordRotate from "@/components/ui/word-rotate";

export default async function GoalsPage() {
  const session = await requireSession();
  const { goals } = await getCachedGoalsData(session.user.id);

  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="text-2xl font-bold">Goals</TextShimmer>
          <WordRotate
            words={["Track your study goals", "Set milestones", "Measure your progress", "Stay on target"]}
            className="text-sm text-muted-foreground"
          />
        </div>
        <GoalsShell goals={goals} />
      </div>
    </BlurFade>
  );
}
