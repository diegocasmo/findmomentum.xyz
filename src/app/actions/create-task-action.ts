"use server";

import { createTaskSchema } from "@/app/schemas/create-task-schema";
import { createTask } from "@/lib/services/create-task";
import { parseZodErrors } from "@/lib/utils/form";
import { requireUserId } from "@/lib/utils/require-user-id";
import type { Task } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function createTaskAction(
  formData: FormData
): Promise<ActionResult<Task>> {
  const authResult = await requireUserId();
  if (!authResult.success) return authResult;
  const userId = authResult.data;

  const result = createTaskSchema.safeParse({
    name: formData.get("name"),
    activityId: formData.get("activityId"),
    durationMs: Number(formData.get("durationMs")),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const task = await createTask({
      name: result.data.name,
      activityId: result.data.activityId,
      userId,
      durationMs: result.data.durationMs,
    });
    return { success: true, data: task };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
