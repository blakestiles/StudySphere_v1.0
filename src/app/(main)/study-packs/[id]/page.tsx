
import { requireSession } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import StudyPack from "@/models/StudyPack";
import Topic from "@/models/Topic";
import Flashcard from "@/models/Flashcard";
import QuizQuestion from "@/models/QuizQuestion";
import ClozeQuestion from "@/models/ClozeQuestion";
import StudyPackDetail from "@/components/features/study-packs/StudyPackDetail";

export default async function StudyPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requireSession();

  await connectDB();

  const studyPack = await StudyPack.findById(id).lean();

  if (!studyPack || String(studyPack.userId) !== session.user.id) {
    redirect("/study-packs");
  }

  const [topics, flashcards, quizQuestions, clozeQuestions] = await Promise.all([
    Topic.find({ studyPackId: id }).sort({ order: 1 }).lean(),
    Flashcard.find({ studyPackId: id }).lean(),
    QuizQuestion.find({ studyPackId: id }).lean(),
    ClozeQuestion.find({ studyPackId: id }).lean(),
  ]);

  const serializedStudyPack = {
    _id: String(studyPack._id),
    title: studyPack.title as string,
    summaries: {
      short: (studyPack.summaries as { short?: string; detailed?: string })?.short || "",
      detailed: (studyPack.summaries as { short?: string; detailed?: string })?.detailed || "",
    },
    status: studyPack.status as "generating" | "ready" | "error",
    createdAt: new Date(studyPack.createdAt).toISOString(),
    mindMap: (studyPack as any).mindMap || null,
  };

  const serializedTopics = topics.map((t) => ({
    _id: String(t._id),
    name: t.name as string,
    content: (t.content as string) || "",
    order: (t.order as number) || 0,
    parentTopicId: t.parentTopicId ? String(t.parentTopicId) : undefined,
  }));

  const serializedFlashcards = flashcards.map((f) => ({
    _id: String(f._id),
    question: f.question as string,
    answer: f.answer as string,
    difficulty: f.difficulty as "easy" | "medium" | "hard",
    topicId: f.topicId ? String(f.topicId) : undefined,
    easeFactor: f.easeFactor as number | undefined,
    intervalDays: f.intervalDays as number | undefined,
    repetitions: f.repetitions as number | undefined,
    nextReviewAt: f.nextReviewAt ? new Date(f.nextReviewAt as Date).toISOString() : undefined,
    lastSeenAt: f.lastSeenAt ? new Date(f.lastSeenAt as Date).toISOString() : undefined,
  }));

  const serializedQuizQuestions = quizQuestions.map((q) => ({
    _id: String(q._id),
    question: q.question as string,
    options: q.options as string[],
    correctAnswer: q.correctAnswer as number,
    explanation: (q.explanation as string) || "",
    topicId: q.topicId ? String(q.topicId) : undefined,
  }));

  const serializedClozeQuestions = clozeQuestions.map((c) => ({
    _id: String(c._id),
    originalText: c.originalText as string,
    blankedText: c.blankedText as string,
    answers: c.answers as string[],
    blankCount: (c.answers as string[]).length,
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <StudyPackDetail
        studyPack={serializedStudyPack}
        topics={serializedTopics}
        flashcards={serializedFlashcards}
        quizQuestions={serializedQuizQuestions}
        clozeQuestions={serializedClozeQuestions}
      />
    </div>
  );
}
