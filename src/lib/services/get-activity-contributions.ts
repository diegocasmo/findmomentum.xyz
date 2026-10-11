import { prisma } from "@/lib/prisma";
import { subYears, eachDayOfInterval } from "date-fns";
import type { ActivityContribution } from "@/types";
import { isValidTimezone } from "@/lib/utils/timezone";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "@/lib/utils/time";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type GetActivityContributionsParams = {
  userId: string;
  timezone?: string;
};

export async function getActivityContributions({
  userId,
  timezone = "UTC",
}: GetActivityContributionsParams): Promise<ActivityContribution[]> {
  if (!isValidTimezone(timezone)) {
    console.warn(`Invalid timezone detected: ${timezone}. Defaulting to UTC.`);
    timezone = "UTC";
  }

  const zonedEndDate = toZonedTime(new Date(), timezone);
  const zonedStartDate = subYears(zonedEndDate, 1);

  const utcStartDate = fromZonedTime(zonedStartDate, timezone);
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
      team: teamOwnedBy(userId),
    },
    select: {
      completedAt: true,
    },
    orderBy: {
      completedAt: "asc",
    },
  });

  const allDatesInRange = eachDayOfInterval({
    start: zonedStartDate,
    end: zonedEndDate,
  });

  const contributionMap = new Map<string, number>();
  allDatesInRange.forEach((date) => {
    const dateString = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    contributionMap.set(dateString, 0);
  });

  activities.forEach((activity) => {
    if (activity.completedAt) {
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
