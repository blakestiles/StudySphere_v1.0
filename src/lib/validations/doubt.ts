import { z } from "zod/v4";

export const resolveDoubtSchema = z.object({
  inputText: z.string().min(10, "Please provide at least 10 characters"),
  studyPackId: z.string().optional(),
});

export type ResolveDoubtInput = z.infer<typeof resolveDoubtSchema>;
