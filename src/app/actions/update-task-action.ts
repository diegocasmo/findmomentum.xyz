"use server";

import { z } from "zod";
import { getUpdateTaskSchema } from "@/app/schemas/update-task-schema";
import { updateTask } from "@/lib/services/update-task";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Task } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";
import { getTask } from "@/lib/services/get-task";
import { getTaskElapsedTime } from "@/lib/utils/time";

export async function updateTaskAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  try {
    const authResult = await requireUserId();
    if (!authResult.success) return authResult;
    const userId = authResult.data;

    const taskIdResult = z
      .object({ taskId: z.string().cuid("Invalid task ID") })
      .safeParse({ taskId: formData.get("taskId") });

    if (!taskIdResult.success) {
      return { success: false, errors: parseZodErrors(taskIdResult) };
    }

    const existingTask = await getTask({
      userId,
      taskId: taskIdResult.data.taskId,
    });

    const updateResult = getUpdateTaskSchema(
      getTaskElapsedTime(existingTask)
    ).safeParse({
      taskId: taskIdResult.data.taskId,
      name: formData.get("name"),
      durationMs: Number(formData.get("durationMs")),
    });

    if (!updateResult.success) {
      return { success: false, errors: parseZodErrors(updateResult) };
    }

    const updatedTask = await updateTask({
      userId,
      taskId: updateResult.data.taskId,
      name: updateResult.data.name,
      durationMs: updateResult.data.durationMs,
    });

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("Error updating task:", error);

    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
