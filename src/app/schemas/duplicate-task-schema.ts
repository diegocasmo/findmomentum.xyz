import { z } from "zod";

export const duplicateTaskSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
});
