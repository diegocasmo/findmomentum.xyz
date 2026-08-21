"use server";

import { updateCategorySchema } from "@/app/schemas/update-category-schema";
import { updateCategory } from "@/lib/services/update-category";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Category } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function updateCategoryAction(
  formData: FormData
): Promise<ActionResult<Category>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = updateCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const category = await updateCategory({
      categoryId: result.data.categoryId,
      name: result.data.name,
      userId,
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
