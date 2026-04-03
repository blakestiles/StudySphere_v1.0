import GoalsShell from "@/components/features/goals/GoalsShell";
import { requireSession } from "@/lib/auth-cache";
import { getCachedGoalsData } from "@/lib/data-cache";
import TextShimmer from "@/components/ui/text-shimmer";

export default async function GoalsPage() {
  const session = await requireSession();
  const { goals } = await getCachedGoalsData(session.user.id);

  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Goals</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">Set targets and track your milestones</p>
      </div>
      <GoalsShell goals={goals} />
    </div>
  );
}
