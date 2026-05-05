"use server";

import { updateCategorySchema } from "@/app/schemas/update-category-schema";
import { updateCategory } from "@/lib/services/update-category";
import { parseZodErrors, createZodError } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { Category } from "@prisma/client";
import { transformPrismaErrorToZodError } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function updateCategoryAction(
  formData: FormData
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: parseZodErrors(
        createZodError("User not authenticated", ["root"])
      ),
    };
  }

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
      userId: session.user.id,
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
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
