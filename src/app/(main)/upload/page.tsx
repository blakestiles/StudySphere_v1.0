import UploadShell from "@/components/features/upload/UploadShell";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function UploadPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Upload Study Material</TextShimmer>
          <p className="text-sm text-muted-foreground mt-1">Add a PDF or paste text to generate your AI study pack</p>
        </div>
        <UploadShell />
      </div>
    </BlurFade>
  );
}
