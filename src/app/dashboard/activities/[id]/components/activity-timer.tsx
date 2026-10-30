"use client";

import { useEffect } from "react";
import type { ActivityWithTasksAndTimeEntries } from "@/types";
import {
  formatTimeHHMMss,
  getActivityTotalDuration,
  getTimerSegments,
} from "@/lib/utils/time";
import { getTaskColors } from "@/lib/utils/task-colors";
import { isTaskRunning } from "@/lib/utils/is-task-running";
import { useGetActivityRemainingTime } from "@/hooks/use-get-activity-remaining-time";
import { TimerIcon, HourglassIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RADIUS = 44;
const STROKE_WIDTH = 6;
const RUNNING_STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ArcProps = {
  start: number;
  length: number;
  strokeWidth: number;
  opacity: number;
};

function Arc({ start, length, strokeWidth, opacity }: ArcProps) {
  if (length <= 0) return null;

  // Round caps grow past the dash ends, so pull them in to keep the gaps.
  const capInset = Math.min(strokeWidth / 2 / CIRCUMFERENCE, length / 2);

  return (
    <circle
      cx="50"
      cy="50"
      r={RADIUS}
      pathLength={1}
      strokeLinecap="round"
      strokeOpacity={opacity}
      strokeWidth={strokeWidth}
      strokeDasharray={`${length - 2 * capInset} 1`}
      strokeDashoffset={-(start + capInset)}
    />
  );
}

type ActivityTimerProps = {
  activity: ActivityWithTasksAndTimeEntries;
};

export function ActivityTimer({ activity }: ActivityTimerProps) {
  const totalDurationMs = getActivityTotalDuration(activity);
  const remainingTime = useGetActivityRemainingTime({ activity });
  const segments = getTimerSegments(activity.tasks);
  const colors = getTaskColors(activity.tasks.length);

  useEffect(() => {
    document.title = `Momentum (${formatTimeHHMMss(remainingTime)})`;
    return () => {
      document.title = "Momentum | Small wins. Big progress.";
    };
  }, [remainingTime]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[180px]">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          {/* Start at 12 o'clock and run anticlockwise, draining each arc
              from its 12 o'clock end: tasks played in order empty the ring
              from 12 o'clock as one growing gap. */}
          <g transform="translate(100 0) scale(-1 1) rotate(-90 50 50)">
            {segments.length === 0 && (
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth={STROKE_WIDTH}
              />
            )}
            {segments.map((segment, i) => {
              const task = activity.tasks[i];
              const strokeWidth = isTaskRunning(task)
                ? RUNNING_STROKE_WIDTH
                : STROKE_WIDTH;

              return (
                <g key={segment.taskId} stroke={colors[i]} fill="none">
                  <Arc
                    start={segment.start}
                    length={segment.length}
                    strokeWidth={strokeWidth}
                    opacity={0.2}
                  />
                  <Arc
                    start={segment.start + segment.length - segment.fillLength}
                    length={segment.fillLength}
                    strokeWidth={strokeWidth}
                    opacity={task.completedAt ? 0.4 : 1}
                  />
                </g>
              );
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div
            className="flex items-center gap-2"
            aria-label={`${formatTimeHHMMss(remainingTime)} remaining`}
          >
            <HourglassIcon className="w-5 h-5" />
            <span className="text-2xl font-bold">
              {formatTimeHHMMss(remainingTime)}
            </span>
          </div>
        </div>
      </div>

      <Badge
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 font-normal mt-4"
        title="Total Duration"
      >
        <TimerIcon className="w-3.5 h-3.5" />
        <span className="text-xs whitespace-nowrap">
          {formatTimeHHMMss(totalDurationMs)}
        </span>
      </Badge>
    </div>
  );
}
