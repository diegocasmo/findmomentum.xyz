"use client";

import { useState, useRef, useEffect } from "react";
import {
  startOfWeek,
  addDays,
  subMonths,
  isBefore,
  isSameDay,
  startOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "@/lib/utils/time";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ActivityContribution } from "@/types";

type ContributionGraphProps = {
  contributions: ActivityContribution[];
  timezone?: string;
};

const createContributionMap = (contributions: ActivityContribution[]) => {
  return new Map(contributions.map(({ date, count }) => [date, count]));
};

const getMaxCount = (contributions: ActivityContribution[]) => {
  return Math.max(...contributions.map((c) => c.count));
};

const generateWeeks = (startDate: Date, endDate: Date) => {
  const weeks: Date[][] = [];
  let currentDate = startOfWeek(startDate, { weekStartsOn: 1 }); // Start on Monday

  while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentDate, i);
      if (isBefore(date, startDate)) continue;
      if (isBefore(date, endDate) || isSameDay(date, endDate)) {
        week.push(date);
      }
    }
    if (week.length > 0) {
      weeks.push(week);
    }
    currentDate = addDays(currentDate, 7);
  }

  return weeks;
};

const getCellColor = (count: number, maxCount: number) => {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";

  const intensity = Math.min(4, Math.ceil((count / Math.max(maxCount, 1)) * 4));

  switch (intensity) {
    case 1:
      return "bg-emerald-100 dark:bg-emerald-900";
    case 2:
      return "bg-emerald-300 dark:bg-emerald-700";
    case 3:
      return "bg-emerald-500 dark:bg-emerald-500";
    case 4:
      return "bg-emerald-700 dark:bg-emerald-300";
    default:
      return "bg-gray-100 dark:bg-gray-800";
  }
};

export function ContributionGraph({
  contributions,
  timezone = "UTC",
}: ContributionGraphProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [touchedDate, setTouchedDate] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const contributionMap = createContributionMap(contributions);
  const maxCount = getMaxCount(contributions);

  const endDate = toZonedTime(new Date(), timezone);
  const startDate = startOfMonth(subMonths(endDate, 12));

  const weeks = generateWeeks(startDate, endDate);
  const monthLabels = eachMonthOfInterval({ start: startDate, end: endDate });

  // Scroll to show today's date on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, []);

  // Close tooltip when touching outside
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (
        touchedDate &&
        e.target instanceof Element &&
        !e.target.closest(".contribution-cell")
      ) {
        setTouchedDate(null);
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [touchedDate]);

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-end mb-2">
        <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
          <span className="mr-1 hidden sm:inline">Less</span>
          <div className="flex gap-1">
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm bg-emerald-100 dark:bg-emerald-900" />
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm bg-emerald-500" />
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-sm bg-emerald-700 dark:bg-emerald-300" />
          </div>
          <span className="ml-1 hidden sm:inline">More</span>
        </div>
      </div>

      <div className="overflow-x-auto w-full" ref={scrollContainerRef}>
        <div className="min-w-[750px]">
          <div className="flex w-full">
            <div className="sticky left-0 z-10 pr-2 flex flex-col justify-between text-[10px] sm:text-xs text-muted-foreground bg-background">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>
            <div className="flex gap-1 flex-grow">
              {weeks.map((days, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-1 flex-grow items-center"
                >
                  {days.map((date) => {
                    const dateString = formatInTimeZone(
                      date,
                      timezone,
                      "yyyy-MM-dd"
                    );
                    const count = contributionMap.get(dateString) || 0;

                    return (
                      <TooltipProvider key={dateString}>
                        <Tooltip
                          open={
                            hoveredDate === dateString ||
                            touchedDate === dateString
                          }
                        >
                          <TooltipTrigger asChild>
                            <div
                              className={`contribution-cell h-2 w-2 sm:h-3 sm:w-3 rounded-sm ${getCellColor(
                                count,
                                maxCount
                              )} cursor-pointer transition-colors active:opacity-75`}
                              onPointerEnter={() => setHoveredDate(dateString)}
                              onPointerLeave={() => setHoveredDate(null)}
                              onTouchStart={() => {
                                setTouchedDate(dateString);
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center">
                            <div className="text-xs">
                              <p className="font-medium">
                                {formatInTimeZone(
                                  date,
                                  timezone,
                                  "MMM d, yyyy"
                                )}
                              </p>
                              <p>
                                {count > 0
                                  ? `${count} completed ${
                                      count === 1 ? "activity" : "activities"
                                    }`
                                  : `No completed activities`}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full text-[10px] sm:text-xs text-muted-foreground mt-1">
            <div className="sticky left-0 z-10 mr-2 w-4 bg-background" />
            <div className="flex w-full">
              {monthLabels.map((date, index) => (
                <span key={index} className="flex-grow text-center">
                  {formatInTimeZone(date, timezone, "MMM")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
