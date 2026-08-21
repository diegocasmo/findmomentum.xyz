"use server";

import { duplicateTask } from "@/lib/services/duplicate-task";
import { duplicateTaskSchema } from "@/app/schemas/duplicate-task-schema";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Task } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function duplicateTaskAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = duplicateTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const task = await duplicateTask({
      taskId: result.data.taskId,
      userId,
    });
    return { success: true, data: task };
  } catch (error) {
    console.error("Error duplicating task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
