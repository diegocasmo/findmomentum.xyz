"use server";

import { playTask } from "@/lib/services/play-task";
import { playTaskSchema } from "@/app/schemas/play-task-schema";
import { parseZodErrors, createRootErrors } from "@/lib/utils/form";
import { auth } from "@/lib/auth";
import type { TimeEntry } from "@prisma/client";
import { transformErrorToFieldErrors } from "@/lib/utils/prisma-error-handler";
import type { ActionResult } from "@/types";

export async function playTaskAction(
  formData: FormData
): Promise<ActionResult<TimeEntry>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  const result = playTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!result.success) {
    return { success: false, errors: parseZodErrors(result) };
  }

  try {
    const timeEntry = await playTask({
      taskId: result.data.taskId,
      userId: session.user.id,
    });
    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error playing task:", error);
    return { success: false, errors: transformErrorToFieldErrors(error) };
  }
}
