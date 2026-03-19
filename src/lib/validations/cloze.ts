import { z } from "zod/v4";

export const submitClozeSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string(),
      userAnswers: z.array(z.string()),
    })
  ),
});

export type SubmitClozeInput = z.infer<typeof submitClozeSchema>;
