export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StudyPackGrid from "@/components/features/study-packs/StudyPackGrid";

export default async function StudyPacksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();

  const studyPacks = await StudyPack.find({ userId: session.user.id })
    .populate("documentId", "title")
    .sort({ createdAt: -1 })
    .lean();

  if (studyPacks.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Study Packs</h1>
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">No study packs yet.</p>
          <Link
            href="/dashboard"
            className="text-orange-500 hover:text-orange-400 text-sm transition-colors"
          >
            Go to dashboard to generate your first study pack
          </Link>
        </div>
      </div>
    );
  }

  const serialized = studyPacks.map((sp) => {
    const doc = sp.documentId as { title?: string } | null;
    const docTitle =
      doc && typeof doc === "object" && "title" in doc
        ? doc.title || "Unknown document"
        : "Unknown document";

    return {
      id: String(sp._id),
      title: sp.title as string,
      status: sp.status as string,
      docTitle,
      createdAt: new Date(sp.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold">Study Packs</h1>
      <StudyPackGrid packs={serialized} />
    </div>
  );
}
