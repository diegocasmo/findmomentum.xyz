"use server";

import { updateTaskPositionSchema } from "@/app/schemas/update-task-position-schema";
import { updateTaskPosition } from "@/lib/services/update-task-position";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Task } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function updateTaskPositionAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = updateTaskPositionSchema.safeParse({
    taskId: formData.get("taskId"),
    newPosition: formData.get("newPosition"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const task = await updateTaskPosition({
      taskId: result.data.taskId,
      userId,
      newPosition: result.data.newPosition,
    });
    return { success: true, data: task };
  } catch (error) {
    console.error("Error updating task position:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
