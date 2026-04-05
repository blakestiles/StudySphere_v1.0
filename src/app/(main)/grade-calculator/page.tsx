"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Calculator, TrendingUp, Target } from "lucide-react";

interface CompletedRow {
  id: number;
  name: string;
  weight: number;
  score: number;
}

interface UpcomingRow {
  id: number;
  name: string;
  weight: number;
}

let nextId = 10;

function letterGrade(pct: number): string {
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 60) return "D";
  return "F";
}

export default function GradeCalculatorPage() {
  const [completed, setCompleted] = useState<CompletedRow[]>([
    { id: 1, name: "Midterm", weight: 25, score: 78 },
    { id: 2, name: "Homework", weight: 20, score: 92 },
    { id: 3, name: "Lab", weight: 15, score: 85 },
  ]);

  const [upcoming, setUpcoming] = useState<UpcomingRow[]>([
    { id: 4, name: "Final Exam", weight: 40 },
  ]);

  const [target, setTarget] = useState(90);
  const [whatIfScore, setWhatIfScore] = useState(75);

  // currentPoints is in percentage units (e.g. 50.65 = 50.65% weighted contribution)
  const currentPoints = completed.reduce((sum, r) => sum + (r.score * r.weight) / 100, 0);
  const currentWeight = completed.reduce((sum, r) => sum + r.weight, 0);
  const upcomingWeight = upcoming.reduce((sum, r) => sum + r.weight, 0);
  const totalWeight = currentWeight + upcomingWeight;
  const currentGrade = currentWeight > 0 ? (currentPoints * 100) / currentWeight : null;
  // neededScore and whatIfFinalGrade normalize by totalWeight so they work when weights don't sum to 100
  const neededScore = upcomingWeight > 0
    ? ((target * totalWeight) / 100 - currentPoints) * (100 / upcomingWeight)
    : null;

  const whatIfFinalGrade = upcomingWeight > 0 && currentWeight > 0
    ? (currentPoints + (whatIfScore * upcomingWeight) / 100) * (100 / totalWeight)
    : null;

  function addCompleted() {
    setCompleted((prev) => [...prev, { id: nextId++, name: "", weight: 0, score: 0 }]);
  }

  function updateCompleted(id: number, field: keyof CompletedRow, value: string | number) {
    setCompleted((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function removeCompleted(id: number) {
    setCompleted((prev) => prev.filter((r) => r.id !== id));
  }

  function addUpcoming() {
    setUpcoming((prev) => [...prev, { id: nextId++, name: "", weight: 0 }]);
  }

  function updateUpcoming(id: number, field: keyof UpcomingRow, value: string | number) {
    setUpcoming((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  function removeUpcoming(id: number) {
    setUpcoming((prev) => prev.filter((r) => r.id !== id));
  }

  const inputClass =
    "w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/[0.1] border border-amber-500/20">
          <Calculator className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Grade Calculator</h1>
          <p className="text-sm text-muted-foreground">What-if calculator for your course grades</p>
        </div>
      </motion.div>

      {/* Completed Grades */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden"
      >
        <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-base">Completed Grades</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40">
                  <th className="text-left pb-3 pr-4 font-medium">Assignment Name</th>
                  <th className="text-left pb-3 pr-4 font-medium w-32">Weight (%)</th>
                  <th className="text-left pb-3 pr-4 font-medium w-32">Score (%)</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody className="space-y-2">
                <AnimatePresence initial={false}>
                  {completed.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <td className="py-1.5 pr-4">
                        <input
                          className={inputClass}
                          value={row.name}
                          onChange={(e) => updateCompleted(row.id, "name", e.target.value)}
                          placeholder="e.g. Midterm"
                        />
                      </td>
                      <td className="py-1.5 pr-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputClass}
                          value={row.weight}
                          onChange={(e) => updateCompleted(row.id, "weight", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1.5 pr-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputClass}
                          value={row.score}
                          onChange={(e) => updateCompleted(row.id, "score", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => removeCompleted(row.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <button
            onClick={addCompleted}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
        </div>
      </motion.div>

      {/* Upcoming Assignments */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden"
      >
        <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-base">Upcoming Assignments</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Assignments you haven&apos;t taken yet — we&apos;ll calculate what score you need.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40">
                  <th className="text-left pb-3 pr-4 font-medium">Assignment Name</th>
                  <th className="text-left pb-3 pr-4 font-medium w-32">Weight (%)</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {upcoming.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <td className="py-1.5 pr-4">
                        <input
                          className={inputClass}
                          value={row.name}
                          onChange={(e) => updateUpcoming(row.id, "name", e.target.value)}
                          placeholder="e.g. Final Exam"
                        />
                      </td>
                      <td className="py-1.5 pr-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={inputClass}
                          value={row.weight}
                          onChange={(e) => updateUpcoming(row.id, "weight", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          onClick={() => removeUpcoming(row.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <button
            onClick={addUpcoming}
            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
        </div>
      </motion.div>

      {/* Target Grade */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden"
      >
        <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-4">
            <Target className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-medium">I want to earn at least</span>
            <input
              type="number"
              min={0}
              max={100}
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
              className="w-24 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
            />
            <span className="text-sm font-medium">% in this course</span>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl border border-border/60 bg-card overflow-hidden"
        >
          <div className="h-[2px] bg-gradient-to-r from-amber-500 via-orange-400 to-transparent" />
          <div className="p-6 space-y-6">
            <h2 className="font-semibold text-base">Results</h2>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Current Grade</p>
                {currentGrade !== null ? (
                  <p className="text-2xl font-bold">
                    {currentGrade.toFixed(1)}%
                    <span className="ml-2 text-base font-semibold text-amber-600 dark:text-amber-400">
                      {letterGrade(currentGrade)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No grades yet</p>
                )}
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Weight Accounted For</p>
                <p className="text-2xl font-bold">{totalWeight.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {currentWeight}% done · {upcomingWeight}% upcoming
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Target Grade</p>
                <p className="text-2xl font-bold">
                  {target}%
                  <span className="ml-2 text-base font-semibold text-amber-600 dark:text-amber-400">
                    {letterGrade(target)}
                  </span>
                </p>
              </div>
            </div>

            {/* Main result */}
            <div className="rounded-xl border border-border/40 bg-amber-500/[0.05] p-5">
              {completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add some grades to get started.</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm">
                  Your current weighted grade is{" "}
                  <span className="font-bold">{currentGrade?.toFixed(1)}%</span>.
                  Add upcoming assignments to see what you need to reach your target.
                </p>
              ) : neededScore !== null && neededScore <= 0 ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    You&apos;ve already secured your target grade! Even scoring 0% on upcoming assignments keeps you above {target}%.
                  </p>
                </div>
              ) : neededScore !== null && neededScore > 100 ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                      Not achievable — you&apos;d need {neededScore.toFixed(1)}% on upcoming assignments, which exceeds 100%.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Consider adjusting your target grade or speaking with your instructor.
                    </p>
                  </div>
                </div>
              ) : neededScore !== null ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm">
                      You need{" "}
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                        {neededScore.toFixed(1)}%
                      </span>
                      <span className="ml-1.5 font-semibold text-green-600 dark:text-green-400">
                        ({letterGrade(neededScore)})
                      </span>{" "}
                      on your upcoming assignments to reach {target}%.
                    </p>
                    <p className="text-xs text-muted-foreground">Achievable — keep it up!</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Breakdown table */}
            {upcoming.length > 0 && neededScore !== null && neededScore > 0 && neededScore <= 100 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score Needed Per Assignment</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/40">
                      <th className="text-left pb-2 pr-4 font-medium">Assignment</th>
                      <th className="text-left pb-2 pr-4 font-medium">Weight</th>
                      <th className="text-left pb-2 font-medium">Score Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((row) => (
                      <tr key={row.id} className="border-b border-border/20 last:border-0">
                        <td className="py-2.5 pr-4">{row.name || "—"}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{row.weight}%</td>
                        <td className="py-2.5 font-semibold text-green-600 dark:text-green-400">
                          {neededScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* What-if slider */}
            {upcoming.length > 0 && completed.length > 0 && (
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium">What-If Scenario</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground shrink-0">If I score</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={whatIfScore}
                    onChange={(e) => setWhatIfScore(parseInt(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-bold w-12 text-right">{whatIfScore}%</span>
                </div>
                {whatIfFinalGrade !== null && (
                  <p className="text-sm">
                    on upcoming assignments, my final grade will be{" "}
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {whatIfFinalGrade.toFixed(1)}%
                    </span>
                    {" "}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ({letterGrade(whatIfFinalGrade)})
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
