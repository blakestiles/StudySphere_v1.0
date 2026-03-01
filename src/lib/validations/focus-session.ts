import { z } from "zod/v4";

export const createFocusSessionSchema = z.object({
  studyPackId: z.string().min(1),
  duration: z.number().min(1).max(180),
  goals: z.array(z.string()).optional(),
  workDuration: z.number().min(1).max(120).optional(),
  shortBreakDuration: z.number().min(1).max(60).optional(),
  longBreakDuration: z.number().min(1).max(60).optional(),
});

export const completeFocusSessionSchema = z.object({
  recap: z.string().optional(),
  completedGoals: z.array(z.number()).optional(),
  sessionsCompleted: z.number().optional(),
});

export const tutorChatSchema = z.object({
  studyPackId: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;
export type CompleteFocusSessionInput = z.infer<typeof completeFocusSessionSchema>;
export type TutorChatInput = z.infer<typeof tutorChatSchema>;
