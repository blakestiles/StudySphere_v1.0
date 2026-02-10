import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploadZone from "@/components/features/upload/FileUploadZone";
import TextPasteForm from "@/components/features/upload/TextPasteForm";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Upload Study Material</h1>
        <p className="text-muted-foreground mt-1">
          Upload a PDF or paste text to create study resources
        </p>
      </div>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
          <TabsTrigger value="text">Paste Text</TabsTrigger>
        </TabsList>
        <TabsContent value="pdf" className="mt-4">
          <FileUploadZone />
        </TabsContent>
        <TabsContent value="text" className="mt-4">
          <TextPasteForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
