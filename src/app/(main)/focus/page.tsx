import FocusShell from "@/components/features/focus/FocusShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function FocusPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-5">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Focus Mode</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">
            Pomodoro-powered deep work sessions
          </p>
        </div>
        <FocusShell />
      </div>
    </BlurFade>
  );
}
