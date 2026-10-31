// At least 3:1 contrast on both the light and dark backgrounds. Warm and
// cool hues alternate so neighbors stay distinct.
export const TASK_COLORS = [
  "#3b82f6",
  "#d97706",
  "#8b5cf6",
  "#059669",
  "#f43f5e",
  "#0891b2",
  "#ea580c",
  "#65a30d",
] as const;

export type TaskColor = (typeof TASK_COLORS)[number];

export const DEFAULT_TASK_COLOR: TaskColor = TASK_COLORS[0];

export const TASK_COLOR_NAMES = {
  "#3b82f6": "Blue",
  "#d97706": "Amber",
  "#8b5cf6": "Violet",
  "#059669": "Emerald",
  "#f43f5e": "Rose",
  "#0891b2": "Cyan",
  "#ea580c": "Orange",
  "#65a30d": "Lime",
} as const satisfies Record<TaskColor, string>;
