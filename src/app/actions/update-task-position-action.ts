"use server";

import { updateTaskPositionSchema } from "@/app/schemas/update-task-position-schema";
import { updateTaskPosition } from "@/lib/services/update-task-position";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { Task } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function updateTaskPositionAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

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
      userId: session.user.id,
      newPosition: result.data.newPosition,
    });
    return { success: true, data: task };
  } catch (error) {
    console.error("Error updating task position:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
