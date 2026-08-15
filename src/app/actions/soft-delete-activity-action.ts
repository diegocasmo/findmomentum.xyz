"use server";

import { softDeleteActivity } from "@/lib/services/soft-delete-activity";
import { auth } from "@/lib/auth";
import type { Activity } from "@prisma/client";
import { createRootErrors } from "@/lib/utils/form";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function softDeleteActivityAction(
  activityId: string
): Promise<ActionResult<Activity>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  try {
    const deletedActivity = await softDeleteActivity({
      userId: session.user.id,
      activityId,
    });
    return { success: true, data: deletedActivity };
  } catch (error) {
    console.error("Error soft deleting activity:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
