import { z } from "zod/v4";

export const generateStudyPackSchema = z.object({
  documentId: z.string().min(1),
});

export type GenerateStudyPackInput = z.infer<typeof generateStudyPackSchema>;
