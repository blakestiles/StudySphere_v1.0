import StudyPlanShell from "@/components/features/calendar/StudyPlanShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function StudyPlanPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-5">
        <div>
          <TextShimmer className="text-2xl font-bold">AI Study Plan</TextShimmer>
          <p className="text-sm text-muted-foreground">
            Generate a personalized day-by-day study schedule tailored to your goals
          </p>
        </div>
        <StudyPlanShell />
      </div>
    </BlurFade>
  );
}
