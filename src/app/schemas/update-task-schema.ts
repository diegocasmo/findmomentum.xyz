import { z } from "zod";
import { createTaskSchema } from "@/app/schemas/create-task-schema";
import { taskColorSchema } from "./task-color-schema";

export const getUpdateTaskSchema = (elapsedMs: number) =>
  z.object({
    taskId: z.string().cuid("Invalid task ID"),
    name: createTaskSchema.shape.name,
    color: taskColorSchema.optional(),
    durationMs: createTaskSchema.shape.durationMs.refine(
      (durationMs) => durationMs >= elapsedMs,
      { message: "Duration must be longer than elapsed time" }
    ),
  });
