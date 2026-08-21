"use server";

import { createCategorySchema } from "@/app/schemas/create-category-schema";
import { createCategory } from "@/lib/services/create-category";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Category } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult<Category>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = createCategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const category = await createCategory({
      name: result.data.name,
      userId,
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
