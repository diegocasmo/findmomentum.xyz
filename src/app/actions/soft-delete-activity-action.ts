"use server";

import { softDeleteActivity } from "@/lib/services/soft-delete-activity";
import type { Activity } from "@prisma/client";
import { requireUserId } from "@/lib/utils/require-user-id";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function softDeleteActivityAction(
  activityId: string
): Promise<ActionResult<Activity>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  try {
    const deletedActivity = await softDeleteActivity({
      userId,
      activityId,
    });
    return { success: true, data: deletedActivity };
  } catch (error) {
    console.error("Error soft deleting activity:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
