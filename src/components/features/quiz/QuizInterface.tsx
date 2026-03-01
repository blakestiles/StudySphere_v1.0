"use client";

import { useState } from "react";
import QuizResults from "./QuizResults";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizInterfaceProps {
  questions: Question[];
  studyPackId: string;
}

export default function QuizInterface({ questions, studyPackId }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number; totalQuestions: number } | null>(null);

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const allAnswered = Object.keys(answers).length === questions.length;
  const answeredCount = Object.keys(answers).length;

  function selectAnswer(questionId: string, optionIndex: number) {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await fetch(`/api/study-packs/${studyPackId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      const data = await res.json();
      setResults({ score: data.score, totalQuestions: data.totalQuestions });
      setIsSubmitted(true);

      // Analyze weak areas using the attempt ID
      const attemptId = data.attempt?._id || data.attemptId;
      if (attemptId) {
        fetch("/api/weak-areas/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId }),
        }).catch(() => {});
      }
    } catch {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setIsSubmitting(false);
    setResults(null);
  }

  if (isSubmitted && results) {
    return (
      <QuizResults
        score={results.score}
        totalQuestions={results.totalQuestions}
        questions={questions}
        answers={answers}
        onReset={handleReset}
      />
    );
  }

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Question {currentIndex + 1}
        </p>
        <p className="text-lg font-medium text-foreground">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentQuestion._id] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(currentQuestion._id, idx)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all ${
                  isSelected
                    ? "border-orange-500/50 bg-orange-500/10 text-foreground"
                    : "border-border bg-card text-foreground hover:border-foreground/20"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {letters[idx]}
                </span>
                <span className="flex-1">{option}</span>
                {isSelected && (
                  <svg
                    className="h-5 w-5 shrink-0 text-orange-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
