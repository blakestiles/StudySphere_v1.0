import { z } from "zod/v4";

export const generateReportSchema = z.object({});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
