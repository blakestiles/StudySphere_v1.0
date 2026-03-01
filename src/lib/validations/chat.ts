import { z } from "zod/v4";

export const createThreadSchema = z.object({
  studyPackId: z.string().optional(),
  title: z.string().optional(),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  eli5: z.boolean().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
