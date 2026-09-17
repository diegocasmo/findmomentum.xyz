import { prisma } from "@/lib/prisma";
import { ActivityWithTasksAndTimeEntries } from "@/types";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type GetBookmarkedActivitiesParams = {
  userId: string;
};

export async function getBookmarkedActivities({
  userId,
}: GetBookmarkedActivitiesParams): Promise<ActivityWithTasksAndTimeEntries[]> {
  const bookmarkedActivities = await prisma.activity.findMany({
    where: {
      userId,
      bookmarkedAt: { not: null },
      deletedAt: null,
      team: teamOwnedBy(userId),
    },
    orderBy: {
      bookmarkedAt: "desc",
    },
    include: {
      tasks: {
        where: {
          deletedAt: null,
        },
        include: {
          timeEntries: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      categories: {
        orderBy: { category: { name: "asc" } },
        include: { category: true },
      },
    },
  });

  return bookmarkedActivities;
}
