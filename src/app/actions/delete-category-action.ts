"use server";

import { deleteCategorySchema } from "@/app/schemas/delete-category-schema";
import {
  deleteCategory,
  type DeleteCategoryResult,
} from "@/lib/services/delete-category";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function deleteCategoryAction(
  formData: FormData
): Promise<ActionResult<DeleteCategoryResult>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  const result = deleteCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const deleteResult = await deleteCategory({
      categoryId: result.data.categoryId,
      userId: session.user.id,
    });
    return { success: true, data: deleteResult };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
