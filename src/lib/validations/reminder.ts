import { z } from "zod/v4";

export const markReadSchema = z.object({
  read: z.boolean(),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;
