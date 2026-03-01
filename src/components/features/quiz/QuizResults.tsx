"use client";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  questions: Question[];
  answers: Record<string, number>;
  onReset: () => void;
}

export default function QuizResults({
  score,
  totalQuestions,
  questions,
  answers,
  onReset,
}: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);

  // Color based on score
  const ringColor =
    percentage > 80
      ? "stroke-green-500"
      : percentage > 50
        ? "stroke-orange-500"
        : "stroke-red-500";

  const scoreTextColor =
    percentage > 80
      ? "text-green-600 dark:text-green-400"
      : percentage > 50
        ? "text-orange-600 dark:text-orange-400"
        : "text-red-600 dark:text-red-400";

  const motivationalText =
    percentage > 80
      ? "Excellent work! You really know this material."
      : percentage > 50
        ? "Good effort! A bit more review and you'll ace it."
        : "Keep practicing, you'll improve with each attempt!";

  // SVG circle math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="space-y-8">
      {/* Score Section */}
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center">
          {/* SVG Ring */}
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 180 180">
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                className={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 90 90)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            {/* Score text inside ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreTextColor}`}>
                {score}/{totalQuestions}
              </span>
            </div>
          </div>

          <p className={`mt-3 text-2xl font-bold ${scoreTextColor}`}>
            {percentage}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {motivationalText}
          </p>

          <button
            onClick={onReset}
            className="mt-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-opacity hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Question Review{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({totalQuestions} questions)
          </span>
        </h3>

        {questions.map((q, qIdx) => {
          const userAnswer = answers[q._id];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <div
              key={q._id}
              className="rounded-xl border border-border bg-card"
            >
              {/* Question header */}
              <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isCorrect
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  {isCorrect ? "Correct" : "Wrong"}
                </span>
                <p className="text-sm font-medium text-foreground">
                  {qIdx + 1}. {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 px-5 py-4">
                {q.options.map((option, idx) => {
                  const isUserAnswer = userAnswer === idx;
                  const isCorrectAnswer = q.correctAnswer === idx;
                  const isWrongPick = isUserAnswer && !isCorrect;

                  let containerClass =
                    "rounded-lg border border-border bg-card text-muted-foreground";
                  let iconElement = null;

                  if (isCorrectAnswer) {
                    containerClass =
                      "rounded-lg border-l-4 border border-green-500/30 border-l-green-500 bg-green-500/10 text-green-600 dark:text-green-400";
                    iconElement = (
                      <svg
                        className="h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    );
                  } else if (isWrongPick) {
                    containerClass =
                      "rounded-lg border-l-4 border border-red-500/30 border-l-red-500 bg-red-500/10 text-red-600 dark:text-red-400 line-through";
                    iconElement = (
                      <svg
                        className="h-4 w-4 shrink-0 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${containerClass}`}
                    >
                      <span className="shrink-0 font-medium">
                        {letters[idx]}.
                      </span>
                      <span className="flex-1">{option}</span>
                      {iconElement}
                    </div>
                  );
                })}

                {/* Explanation for wrong answers */}
                {!isCorrect && q.explanation && (
                  <div className="mt-1 rounded-lg bg-orange-500/10 px-4 py-3 text-sm text-orange-600 dark:text-orange-400">
                    <span className="font-medium">Explanation:</span>{" "}
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
