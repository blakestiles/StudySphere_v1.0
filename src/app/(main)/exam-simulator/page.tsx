import ExamShell from "@/components/features/exam/ExamShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function ExamSimulatorPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="space-y-4">
        <div>
          <TextShimmer className="text-2xl font-bold">AI Exam Simulator</TextShimmer>
          <p className="text-sm text-muted-foreground">
            Generate timed exams from your study materials with AI
          </p>
        </div>
        <ExamShell />
      </div>
    </BlurFade>
  );
}
