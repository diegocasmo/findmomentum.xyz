"use server";

import { pauseTask } from "@/lib/services/pause-task";
import { pauseTaskSchema } from "@/app/schemas/pause-task-schema";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { TimeEntry } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function pauseTaskAction(
  formData: FormData
): Promise<ActionResult<TimeEntry | null>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = pauseTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const timeEntry = await pauseTask({
      taskId: result.data.taskId,
      userId,
    });
    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error pausing task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
