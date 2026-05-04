import { z } from "zod";
import { createCategorySchema } from "@/app/schemas/create-category-schema";

export const updateCategorySchema = createCategorySchema.extend({
  categoryId: z.string().cuid("Invalid category ID"),
});

export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
