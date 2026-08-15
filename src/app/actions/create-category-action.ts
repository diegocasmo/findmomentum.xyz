"use server";

import { createCategorySchema } from "@/app/schemas/create-category-schema";
import { createCategory } from "@/lib/services/create-category";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { Category } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  const result = createCategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const category = await createCategory({
      name: result.data.name,
      userId: session.user.id,
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
