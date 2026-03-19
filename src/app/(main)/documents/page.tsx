import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectDB();

  const documents = await Document.find({ userId: session.user.id })
    .sort({ uploadedAt: -1 })
    .select("-rawText")
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            All your uploaded documents
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Upload New
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No documents yet. Upload your first document to get started.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upload Document
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc: Record<string, unknown>) => (
            <Link
              key={(doc._id as { toString(): string }).toString()}
              href={`/documents/${(doc._id as { toString(): string }).toString()}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-2">
                      {doc.title as string}
                    </h3>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {(doc.fileType as string).toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {new Date(doc.uploadedAt as string).toLocaleDateString()}
                    </span>
                    <Badge
                      variant={doc.status === "ready" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {doc.status as string}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
