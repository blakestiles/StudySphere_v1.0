import CalendarShell from "@/components/features/calendar/CalendarShell";
import TextShimmer from "@/components/ui/text-shimmer";

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Study Planner</TextShimmer>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule and track your study sessions
        </p>
      </div>
      <CalendarShell />
    </div>
  );
}
