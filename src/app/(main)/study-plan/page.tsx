import StudyPlanShell from "@/components/features/calendar/StudyPlanShell";
import TextShimmer from "@/components/ui/text-shimmer";

export default function StudyPlanPage() {
  return (
    <div className="space-y-5">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">AI Study Plan</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a personalized day-by-day study schedule tailored to your goals
        </p>
      </div>
      <StudyPlanShell />
    </div>
  );
}
