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

export function getTaskColors(count: number): string[] {
  const colors: string[] = Array.from(
    { length: count },
    (_, i) => TASK_COLORS[i % TASK_COLORS.length]
  );

  // On the ring the last arc touches the first, so they must differ too.
  if (count > 1 && colors[count - 1] === colors[0]) {
    colors[count - 1] = TASK_COLORS[1];
  }

  return colors;
}
