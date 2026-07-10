import { intervalToDuration, formatDistanceToNow, format } from "date-fns";
import type {
  ActivityWithTasksAndTimeEntries,
  TaskWithTimeEntries,
} from "@/types";
import {
  formatInTimeZone as tzFormatInTimeZone,
  toZonedTime as tzToZonedTime,
  fromZonedTime as tzFromZonedTime,
} from "date-fns-tz";

export const formatInTimeZone = tzFormatInTimeZone;
export const toZonedTime = tzToZonedTime;
export const fromZonedTime = tzFromZonedTime;

export const MS_PER_SECOND = 1000;
const SECONDS_PER_MIN = 60;
export const MS_PER_MIN = SECONDS_PER_MIN * MS_PER_SECOND;
const MIN_PER_HOUR = 60;
const MS_PER_HOUR = MIN_PER_HOUR * MS_PER_MIN;

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
  const elpasedMs = task.timeEntries.reduce((total, entry) => {
    const start = new Date(entry.startedAt).getTime();
    const end = entry.stoppedAt ? new Date(entry.stoppedAt).getTime() : now;
    return total + (end - start);
  }, 0);

  return Math.max(0, task.durationMs - elpasedMs);
}

export function getTaskElapsedTime(task: TaskWithTimeEntries): number {
  return task.durationMs - getTaskRemainingTime(task);
}

type FormatDateOptions = {
  /** How many days back to show “x ago” instead of an absolute date */
  recencyThresholdDays?: number;
  /** date-fns format string for absolute dates (see https://date-fns.org/v2.30.0/docs/format) */
  absoluteDateFormat?: string;
};

/**
 * Returns a human-readable timestamp:
 *  - "5 minutes ago" if within recencyThresholdDays
 *  - otherwise a formatted date like "Jan 5, 2022"
 */
export function formatDateAsTimeAgo(
  date: Date,
  options: FormatDateOptions = {}
): string {
  const { recencyThresholdDays = 10, absoluteDateFormat = "PP" } = options;

  const now = Date.now();
  const elapsedMs = now - date.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  if (elapsedDays < recencyThresholdDays) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, absoluteDateFormat);
}

export function formatDateWithTime(date: Date): string {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}
