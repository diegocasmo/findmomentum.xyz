// Tailwind 500 shades: readable on both the light and dark backgrounds.
// Warm and cool hues alternate so neighbors stay distinct.
export const TASK_COLORS = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
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
