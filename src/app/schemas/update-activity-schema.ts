import { z } from "zod";
import { createActivitySchema } from "@/app/schemas/create-activity-schema";

export const updateActivitySchema = createActivitySchema.extend({
  activityId: z.string().cuid("Invalid activity ID"),
});
