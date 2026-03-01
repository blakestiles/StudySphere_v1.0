import { z } from "zod/v4";

export const gradeEssaySchema = z.object({
  studyPackId: z.string().optional(),
  question: z.string().min(1, "Question is required"),
  essayText: z.string().min(50, "Essay must be at least 50 characters"),
});

export type GradeEssayInput = z.infer<typeof gradeEssaySchema>;
