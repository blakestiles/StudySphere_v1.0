import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploadZone from "@/components/features/upload/FileUploadZone";
import TextPasteForm from "@/components/features/upload/TextPasteForm";
import BlurFade from "@/components/ui/blur-fade";
import TextShimmer from "@/components/ui/text-shimmer";

export default function UploadPage() {
  return (
    <BlurFade delay={0.1} duration={0.4}>
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <TextShimmer className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Upload Study Material</TextShimmer>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
          <TabsTrigger value="pdf" className="rounded-lg font-medium">PDF Upload</TabsTrigger>
          <TabsTrigger value="text" className="rounded-lg font-medium">Paste Text</TabsTrigger>
        </TabsList>
        <TabsContent value="pdf" className="mt-4">
          <FileUploadZone />
        </TabsContent>
        <TabsContent value="text" className="mt-4">
          <TextPasteForm />
        </TabsContent>
      </Tabs>
    </div>
    </BlurFade>
  );
}
