"use server";

import { softDeleteTask } from "@/lib/services/soft-delete-task";
import { auth } from "@/lib/auth";
import type { Task } from "@prisma/client";
import { createRootErrors } from "@/lib/utils/form";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function softDeleteTaskAction(
  taskId: string
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  try {
    const deletedTask = await softDeleteTask({
      userId: session.user.id,
      taskId,
    });
    return { success: true, data: deletedTask };
  } catch (error) {
    console.error("Error soft deleting task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
