"use server";

import { pauseTask } from "@/lib/services/pause-task";
import { pauseTaskSchema } from "@/app/schemas/pause-task-schema";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { TimeEntry } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function pauseTaskAction(
  formData: FormData
): Promise<ActionResult<TimeEntry | null>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  const result = pauseTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const timeEntry = await pauseTask({
      taskId: result.data.taskId,
      userId: session.user.id,
    });
    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error pausing task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
