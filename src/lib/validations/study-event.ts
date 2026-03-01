import { z } from "zod/v4";

export const createStudyEventSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().min(1),
  startTime: z.string().optional(),
  duration: z.number().min(5).max(480).optional(),
  color: z.string().optional(),
  studyPackId: z.string().optional(),
  topicId: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export const updateStudyEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  duration: z.number().min(5).max(480).optional(),
  color: z.string().optional(),
  studyPackId: z.string().optional(),
  topicId: z.string().optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
});

export const generateStudyPlanSchema = z.object({
  studyPackIds: z.array(z.string()).min(1),
  intensity: z.enum(["relaxed", "balanced", "intense"]),
  preferredTime: z.enum(["morning", "afternoon", "evening"]),
  targetDate: z.string().min(1),
});

export type CreateStudyEventInput = z.infer<typeof createStudyEventSchema>;
export type UpdateStudyEventInput = z.infer<typeof updateStudyEventSchema>;
export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanSchema>;
