import { z } from "zod/v4";

export const generateExamSchema = z.object({
  studyPackId: z.string().min(1, "Study pack is required"),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  questionCount: z.number().int().min(5).max(50),
  duration: z.number().int().min(5).max(180),
});

export type GenerateExamInput = z.infer<typeof generateExamSchema>;

export const submitExamSchema = z.object({
  examId: z.string().min(1),
  studyPackId: z.string().min(1),
  responses: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedAnswer: z.number().int().min(0),
      timeSpent: z.number().min(0),
    })
  ),
  duration: z.number().min(0),
  timeTaken: z.number().min(0),
  proctored: z.boolean(),
});

export type SubmitExamInput = z.infer<typeof submitExamSchema>;
