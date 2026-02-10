import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Document from "@/models/Document";
import StudyPack from "@/models/StudyPack";
import QuizAttempt from "@/models/QuizAttempt";
import DashboardStats from "@/components/features/dashboard/DashboardStats";
import RecentDocuments from "@/components/features/dashboard/RecentDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const [documents, studyPackCount, quizCount] = await Promise.all([
    Document.find({ userId: session.user.id })
      .sort({ uploadedAt: -1 })
      .limit(5)
      .select("-rawText")
      .lean(),
    StudyPack.countDocuments({ userId: session.user.id }),
    QuizAttempt.countDocuments({ userId: session.user.id }),
  ]);

  const serializedDocs = documents.map((doc) => ({
    _id: String(doc._id),
    title: doc.title as string,
    fileType: doc.fileType as "pdf" | "text",
    status: doc.status as "processing" | "ready" | "error",
    uploadedAt: new Date(doc.uploadedAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}!
          </p>
        </div>
        <Link href="/upload">
          <Button>Upload Material</Button>
        </Link>
      </div>

      <DashboardStats
        documentCount={documents.length}
        studyPackCount={studyPackCount}
        quizCount={quizCount}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentDocuments documents={serializedDocs} />
        </CardContent>
      </Card>
    </div>
  );
}
