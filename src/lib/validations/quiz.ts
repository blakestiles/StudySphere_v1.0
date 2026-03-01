import { z } from "zod/v4";

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.number(),
    })
  ),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
