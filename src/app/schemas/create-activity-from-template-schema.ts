import { z } from "zod";

export const createActivityFromTemplateSchema = z.object({
  activityId: z.string().cuid("Invalid activity ID"),
});
