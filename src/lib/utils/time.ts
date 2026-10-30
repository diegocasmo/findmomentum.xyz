import { intervalToDuration, formatDistanceToNow, format } from "date-fns";
import type {
  ActivityWithTasksAndTimeEntries,
  TaskWithTimeEntries,
} from "@/types";

export { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

export const MS_PER_SECOND = 1000;
const SECONDS_PER_MIN = 60;
export const MS_PER_MIN = SECONDS_PER_MIN * MS_PER_SECOND;
const MIN_PER_HOUR = 60;
const MS_PER_HOUR = MIN_PER_HOUR * MS_PER_MIN;
const HOURS_PER_DAY = 24;
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;

export function formatTimeMMss(ms: number): string {
  const minutes = Math.floor(ms / MS_PER_MIN);
  const seconds = Math.floor((ms % MS_PER_MIN) / MS_PER_SECOND);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function formatTimeHHMMss(ms: number) {
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MIN);
  const seconds = Math.floor((ms % MS_PER_MIN) / MS_PER_SECOND);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatMsAsDuration(ms: number) {
  const duration = intervalToDuration({ start: 0, end: ms });
  const parts: string[] = [];

  if (duration.hours) parts.push(`${duration.hours}h`);
  if (duration.minutes) parts.push(`${duration.minutes}m`);
  if (duration.seconds && parts.length === 0)
    parts.push(`${duration.seconds}s`);

  return parts.join(" ") || "0s";
}

export function getActivityTotalDuration(
  activity: ActivityWithTasksAndTimeEntries
): number {
  return activity.tasks.reduce((sum, task) => sum + task.durationMs, 0);
}

export function getActivityRemainingTime(
  activity: ActivityWithTasksAndTimeEntries
): number {
  return activity.tasks.reduce(
    (sum, task) => sum + getTaskRemainingTime(task),
    0
  );
}

export function getTaskRemainingTime(task: TaskWithTimeEntries): number {
  const now = Date.now();
  const elapsedMs = task.timeEntries.reduce((total, entry) => {
    const start = new Date(entry.startedAt).getTime();
    const end = entry.stoppedAt ? new Date(entry.stoppedAt).getTime() : now;
    return total + (end - start);
  }, 0);

  return Math.max(0, task.durationMs - elapsedMs);
}

export function getTaskElapsedTime(task: TaskWithTimeEntries): number {
  return task.durationMs - getTaskRemainingTime(task);
}

const TIMER_SEGMENT_GAP = 0.01;

// Fractions of the full circle, so the ring can use any radius.
export type TimerSegment = {
  taskId: string;
  start: number;
  length: number;
  fillLength: number;
};

export function getTimerSegments(tasks: TaskWithTimeEntries[]): TimerSegment[] {
  const totalMs = tasks.reduce((sum, task) => sum + task.durationMs, 0);

  let offset = 0;
  return tasks.map((task) => {
    const share = task.durationMs / totalMs;
    // Cap the gap at half the share so it never exceeds the task's own arc.
    const gap = tasks.length > 1 ? Math.min(TIMER_SEGMENT_GAP, share / 2) : 0;
    const length = share - gap;
    // A client clock behind the server makes elapsed time negative.
    const remaining = Math.min(1, getTaskRemainingTime(task) / task.durationMs);
    const segment = {
      taskId: task.id,
      start: offset + gap / 2,
      length,
      fillLength: task.completedAt ? length : length * remaining,
    };
    offset += share;
    return segment;
  });
}

const RECENCY_THRESHOLD_DAYS = 10;

/**
 * Returns a human-readable timestamp:
 *  - "5 minutes ago" if within RECENCY_THRESHOLD_DAYS
 *  - otherwise a formatted date like "Jan 5, 2022"
 */
export function formatDateAsTimeAgo(date: Date): string {
  const now = Date.now();
  const elapsedMs = now - date.getTime();
  const elapsedDays = elapsedMs / MS_PER_DAY;

  if (elapsedDays < RECENCY_THRESHOLD_DAYS) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, "PP");
}

export function formatDateWithTime(date: Date): string {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}
