"use server";

import { deleteCategorySchema } from "@/app/schemas/delete-category-schema";
import { deleteCategory } from "@/lib/services/delete-category";
import { parseZodErrors, createZodError } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import { transformPrismaErrorToZodError } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

type DeleteCategoryResult = {
  id: string;
  affectedActivitiesCount: number;
};

export async function deleteCategoryAction(
  formData: FormData
): Promise<ActionResult<DeleteCategoryResult>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: parseZodErrors(
        createZodError("User not authenticated", ["root"])
      ),
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
    const zodError =
      transformPrismaErrorToZodError(error) ||
      createZodError("An unexpected error occurred. Please try again.", [
        "root",
      ]);
    return {
      success: false,
      errors: parseZodErrors(zodError),
    };
  }
}
