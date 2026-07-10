import { z } from "zod";

export const createActivitySchema = z.object({
  name: z
    .string()
    .min(1, "Activity name is required")

    .max(255, "Task name is too long")
    .transform((v) => v.trim()),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .transform((v) => v?.trim() || ""),
  categoryIds: z.array(z.string().cuid()).default([]),
});
