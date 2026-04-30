import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(30, "Category name must be 30 characters or less")
    .transform((v) => v.trim()),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
