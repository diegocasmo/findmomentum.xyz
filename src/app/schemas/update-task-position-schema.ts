import { z } from "zod";

export const updateTaskPositionSchema = z.object({
  taskId: z.string().cuid("Invalid task ID"),
  newPosition: z.union([
    z.literal("top"),
    z.literal("bottom"),
    z.string().cuid("Invalid task ID for afterTaskId"),
  ]),
});
