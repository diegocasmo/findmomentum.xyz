"use server";

import { createActivitySchema } from "@/app/schemas/create-activity-schema";
import { createActivity } from "@/lib/services/create-activity";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult, ActivityWithCategories } from "@/types";

export async function createActivityAction(
  formData: FormData
): Promise<ActionResult<ActivityWithCategories>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = createActivitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryIds: formData.getAll("categoryIds"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }
  try {
    const activity = await createActivity({
      name: result.data.name,
      description: result.data.description,
      userId,
      categoryIds: result.data.categoryIds,
    });
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating activity:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
