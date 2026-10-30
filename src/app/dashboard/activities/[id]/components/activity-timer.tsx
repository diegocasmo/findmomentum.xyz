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

const RADIUS = 45;
const STROKE_WIDTH = 4;
const RUNNING_STROKE_WIDTH = 8;

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
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
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
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  pathLength={1}
                  strokeOpacity={0.2}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segment.length} 1`}
                  strokeDashoffset={-segment.start}
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  pathLength={1}
                  strokeOpacity={task.completedAt ? 0.4 : 1}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segment.fillLength} 1`}
                  strokeDashoffset={-segment.start}
                />
              </g>
            );
          })}
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
