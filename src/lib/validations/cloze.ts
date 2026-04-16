import { z } from "zod/v4";

export const submitClozeSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string().min(1),
      userAnswers: z.array(z.string().max(500)).max(20),
    })
  ).min(1).max(100),
});

export type SubmitClozeInput = z.infer<typeof submitClozeSchema>;
