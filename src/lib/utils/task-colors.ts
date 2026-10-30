// Tailwind shades with at least 3:1 contrast on both the light and dark
// backgrounds. Warm and cool hues alternate so neighbors stay distinct.
export const TASK_COLORS = [
  "#3b82f6", // blue-500
  "#d97706", // amber-600
  "#8b5cf6", // violet-500
  "#059669", // emerald-600
  "#f43f5e", // rose-500
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#65a30d", // lime-600
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
