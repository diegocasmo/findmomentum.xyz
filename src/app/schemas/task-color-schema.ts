import { z } from "zod";
import { TASK_COLORS } from "@/lib/utils/task-colors";

export const taskColorSchema = z.enum(TASK_COLORS, {
  error: "Choose a supported task color",
});
