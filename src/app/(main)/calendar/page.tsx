import CalendarShell from "@/components/features/calendar/CalendarShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function CalendarPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="text-2xl font-bold">Study Planner</TextShimmer>
          <p className="text-sm text-muted-foreground">
            Schedule and track your study sessions
          </p>
        </div>
        <CalendarShell />
      </div>
    </BlurFade>
  );
}
