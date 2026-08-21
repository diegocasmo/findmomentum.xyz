"use server";

import { playTask } from "@/lib/services/play-task";
import { playTaskSchema } from "@/app/schemas/play-task-schema";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { TimeEntry } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function playTaskAction(
  formData: FormData
): Promise<ActionResult<TimeEntry>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = playTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const timeEntry = await playTask({
      taskId: result.data.taskId,
      userId,
    });
    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error playing task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
