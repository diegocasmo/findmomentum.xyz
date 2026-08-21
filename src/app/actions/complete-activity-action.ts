"use server";

import { completeActivity } from "@/lib/services/complete-activity";
import { completeActivitySchema } from "@/app/schemas/complete-activity-schema";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Activity } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function completeActivityAction(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = completeActivitySchema.safeParse({
    activityId: formData.get("activityId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const activity = await completeActivity({
      activityId: result.data.activityId,
      userId,
    });
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error completing activity:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
