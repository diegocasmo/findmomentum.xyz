"use server";

import { createActivityFromTemplate } from "@/lib/services/create-activity-from-template";
import { createActivityFromTemplateSchema } from "@/app/schemas/create-activity-from-template-schema";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Activity } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function createActivityFromTemplateAction(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = createActivityFromTemplateSchema.safeParse({
    activityId: formData.get("activityId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const activity = await createActivityFromTemplate({
      activityId: result.data.activityId,
      userId,
    });
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating activity from template:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
