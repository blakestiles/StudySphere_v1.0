import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import Annotation from "@/models/Annotation";
import DocumentViewer from "@/components/features/documents/DocumentViewer";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  await connectDB();

  const doc = await Document.findById(id).lean();
  if (!doc || doc.userId.toString() !== session.user.id) {
    redirect("/documents");
  }

  const annotations = await Annotation.find({
    userId: session.user.id,
    documentId: id,
  })
    .sort({ startOffset: 1 })
    .lean();

  // Serialize for client component
  const serializedDoc = {
    _id: doc._id.toString(),
    title: doc.title,
    rawText: doc.rawText,
    fileType: doc.fileType,
    uploadedAt: doc.uploadedAt.toISOString(),
  };

  const serializedAnnotations = annotations.map((a: Record<string, unknown>) => ({
    _id: (a._id as { toString(): string }).toString(),
    type: a.type as "highlight" | "underline" | "note",
    color: a.color as string,
    startOffset: a.startOffset as number,
    endOffset: a.endOffset as number,
    selectedText: (a.selectedText as string) || "",
    noteText: (a.noteText as string) || "",
  }));

  return (
    <div className="space-y-6">
      <DocumentViewer
        document={serializedDoc}
        initialAnnotations={serializedAnnotations}
      />
    </div>
  );
}
