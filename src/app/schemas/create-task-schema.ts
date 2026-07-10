import { z } from "zod";

import { MS_PER_MIN, MS_PER_SECOND } from "@/lib/utils/time";
export const MAX_MIN = 59;
export const MAX_SEC = 59;
const MAX_DURATION_MS = MAX_MIN * MS_PER_MIN + MAX_SEC * MS_PER_SECOND;

export const createTaskSchema = z.object({
  name: z
    .string()
    .min(1, "Task name is required")
    .max(255, "Task name is too long")
    .transform((v) => v.trim()),
  activityId: z.string().cuid("Invalid activity ID"),
  durationMs: z
    .number()
    .int()
    .positive("Duration must be in MM:ss format (e.g., 25:00)")
    .max(MAX_DURATION_MS, "Duration must be 59:59 or less"),
});
