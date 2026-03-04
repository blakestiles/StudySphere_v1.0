import { z } from "zod/v4";

export const generateExamSchema = z.object({
  studyPackId: z.string().min(1, "Study pack is required"),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  questionCount: z.number().int().min(5).max(50),
  duration: z.number().int().min(5).max(180),
});

export type GenerateExamInput = z.infer<typeof generateExamSchema>;

export const submitExamSchema = z.object({
  studyPackId: z.string().min(1),
  questions: z.array(
    z.object({
      questionText: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      difficulty: z.string(),
    })
  ),
  responses: z.array(
    z.object({
      questionIndex: z.number(),
      selectedAnswer: z.number(),
      isCorrect: z.boolean(),
      timeSpent: z.number(),
    })
  ),
  duration: z.number(),
  timeTaken: z.number(),
  proctored: z.boolean(),
});

export type SubmitExamInput = z.infer<typeof submitExamSchema>;
