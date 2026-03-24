import FocusShell from "@/components/features/focus/FocusShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function FocusPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-6">
        <div className="text-center">
          <TextShimmer className="text-2xl font-bold">Focus Mode</TextShimmer>
          <p className="text-sm text-muted-foreground">
            Pomodoro-powered deep work sessions
          </p>
        </div>
        <FocusShell />
      </div>
    </BlurFade>
  );
}
