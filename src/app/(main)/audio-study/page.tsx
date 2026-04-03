import AudioShell from "@/components/features/audio/AudioShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function AudioStudyPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Audio Study Mode</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">
            Listen to your study materials with text-to-speech
          </p>
        </div>
        <AudioShell />
      </div>
    </BlurFade>
  );
}
