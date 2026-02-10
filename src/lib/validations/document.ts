import { z } from "zod/v4";

export const textUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export type TextUploadInput = z.infer<typeof textUploadSchema>;
