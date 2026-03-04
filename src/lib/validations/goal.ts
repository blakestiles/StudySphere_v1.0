import { z } from "zod/v4";

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetType: z.enum(["flashcards_reviewed", "quiz_score", "study_minutes", "essays_written", "packs_completed", "custom"]),
  targetValue: z.number().min(1, "Target must be at least 1"),
  deadline: z.string().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  title: z.string().optional(),
  currentValue: z.number().optional(),
  requestSuggestion: z.boolean().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
