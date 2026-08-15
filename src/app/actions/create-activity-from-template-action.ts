"use server";

import { createActivityFromTemplate } from "@/lib/services/create-activity-from-template";
import { createActivityFromTemplateSchema } from "@/app/schemas/create-activity-from-template-schema";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { Activity } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function createActivityFromTemplateAction(
  formData: FormData
): Promise<ActionResult<Activity>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  const result = createActivityFromTemplateSchema.safeParse({
    activityId: formData.get("activityId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const activity = await createActivityFromTemplate({
      activityId: result.data.activityId,
      userId: session.user.id,
    });
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error creating activity from template:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
