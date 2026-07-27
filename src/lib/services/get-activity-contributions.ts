import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import { subYears, eachDayOfInterval } from "date-fns";
import type { ActivityContribution } from "@/types";
import { isValidTimezone } from "@/lib/utils/timezone";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "@/lib/utils/time";

type GetActivityContributionsParams = {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
};

export async function getActivityContributions({
  userId,
  startDate,
  endDate = new Date(),
  timezone = "UTC",
}: GetActivityContributionsParams): Promise<ActivityContribution[]> {
  if (!isValidTimezone(timezone)) {
    console.warn(`Invalid timezone detected: ${timezone}. Defaulting to UTC.`);
    timezone = "UTC";
  }

  const zonedEndDate = toZonedTime(endDate, timezone);

  let actualStartDate = startDate
    ? toZonedTime(startDate, timezone)
    : subYears(zonedEndDate, 1);

  // Ensure the date range is no longer than one year
  const oneYearBeforeEndDate = subYears(zonedEndDate, 1);
  if (actualStartDate < oneYearBeforeEndDate) {
    actualStartDate = oneYearBeforeEndDate;
  }

  // Convert dates back to UTC for database query
  const utcStartDate = fromZonedTime(actualStartDate, timezone);
  const utcEndDate = fromZonedTime(zonedEndDate, timezone);

  const activities = await prisma.activity.findMany({
    where: {
      userId,
      deletedAt: null,
      completedAt: {
        not: null,
        gte: utcStartDate,
        lte: utcEndDate,
      },
      team: {
        teamMemberships: {
          some: {
            userId,
            role: TeamMembershipRole.OWNER,
          },
        },
      },
    },
    select: {
      completedAt: true,
    },
    orderBy: {
      completedAt: "asc",
    },
  });

  const allDatesInRange = eachDayOfInterval({
    start: actualStartDate,
    end: zonedEndDate,
  });

  const contributionMap = new Map<string, number>();
  allDatesInRange.forEach((date) => {
    const dateString = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    contributionMap.set(dateString, 0);
  });

  activities.forEach((activity) => {
    if (activity.completedAt) {
      // Convert UTC database date to user's timezone before formatting
      const zonedDate = toZonedTime(activity.completedAt, timezone);
      const dateString = formatInTimeZone(zonedDate, timezone, "yyyy-MM-dd");
      const currentCount = contributionMap.get(dateString) || 0;
      contributionMap.set(dateString, currentCount + 1);
    }
  });

  return Array.from(contributionMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}
