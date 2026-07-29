import { z } from "zod";
import { createTaskSchema } from "@/app/schemas/create-task-schema";

export const getUpdateTaskSchema = (elapsedMs: number) =>
  z.object({
    taskId: z.string().cuid("Invalid task ID"),
    name: createTaskSchema.shape.name,
    durationMs: createTaskSchema.shape.durationMs.refine(
      (durationMs) => {
        if (durationMs < elapsedMs) {
          return false;
        }
        return true;
      },
      {
        message: `Duration must be longer than elapsed time`,
      }
    ),
  });
