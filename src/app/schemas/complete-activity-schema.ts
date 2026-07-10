import { z } from "zod";

export const completeActivitySchema = z.object({
  activityId: z.string().cuid("Invalid activity ID"),
});
