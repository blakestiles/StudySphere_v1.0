import { z } from "zod/v4";

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.number().int().min(0).max(10),
    })
  ).min(1).max(200),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
