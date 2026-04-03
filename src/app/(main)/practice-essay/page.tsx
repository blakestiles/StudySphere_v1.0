import EssayShell from "@/components/features/essays/EssayShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function PracticeEssayPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Practice Essay</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">
            Write answers and get AI feedback on accuracy, depth &amp; clarity
          </p>
        </div>
        <EssayShell />
      </div>
    </BlurFade>
  );
}
