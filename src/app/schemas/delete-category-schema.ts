import { z } from "zod";

export const deleteCategorySchema = z.object({
  categoryId: z.string().cuid("Invalid category ID"),
});

export type DeleteCategorySchema = z.infer<typeof deleteCategorySchema>;
