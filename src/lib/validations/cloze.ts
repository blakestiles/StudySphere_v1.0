import { z } from "zod/v4";

export const generateClozeSchema = z.object({
  studyPackId: z.string().min(1, "Study pack ID is required"),
});

export type GenerateClozeInput = z.infer<typeof generateClozeSchema>;

export const submitClozeSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string(),
      userAnswers: z.array(z.string()),
    })
  ),
});

export type SubmitClozeInput = z.infer<typeof submitClozeSchema>;
