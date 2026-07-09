import { z } from "zod";

export const CATEGORY_NAME_MAX_LENGTH = 30;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(CATEGORY_NAME_MAX_LENGTH, "Category name must be 30 characters or less")
    .transform((v) => v.trim()),
});

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
