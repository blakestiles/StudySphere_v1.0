import { z } from "zod/v4";

export const createNotebookSchema = z.object({
  title: z.string().optional(),
  studyPackId: z.string().optional(),
});

export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;

export const updateNotebookSchema = z.object({
  title: z.string().optional(),
  cues: z.string().optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
});

export type UpdateNotebookInput = z.infer<typeof updateNotebookSchema>;
