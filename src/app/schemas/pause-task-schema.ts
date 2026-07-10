import { z } from "zod";

export const pauseTaskSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
});
