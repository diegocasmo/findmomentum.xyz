"use server";

import { updateActivitySchema } from "@/app/schemas/update-activity-schema";
import { updateActivity } from "@/lib/services/update-activity";
import { parseZodErrors, createZodError } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import { transformPrismaErrorToZodError } from "@/lib/utils/prisma-error-handler";
import type { ActionResult, ActivityWithCategories } from "@/types";

export async function updateActivityAction(
  formData: FormData
): Promise<ActionResult<ActivityWithCategories>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: parseZodErrors(
        createZodError("User not authenticated", ["root"])
      ),
    };
  }

  const result = updateActivitySchema.safeParse({
    activityId: formData.get("activityId"),
    name: formData.get("name"),
    description: formData.get("description"),
    categoryIds: formData.getAll("categoryIds"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }
  try {
    const activity = await updateActivity({
      activityId: result.data.activityId,
      name: result.data.name,
      description: result.data.description,
      userId: session.user.id,
      categoryIds: result.data.categoryIds,
    });
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error updating activity:", error);
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
