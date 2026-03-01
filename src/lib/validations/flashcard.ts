import { z } from "zod/v4";

export const reviewFlashcardSchema = z.object({
  flashcardId: z.string().min(1),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
