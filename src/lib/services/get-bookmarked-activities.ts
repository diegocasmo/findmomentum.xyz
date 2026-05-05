import { prisma } from "@/lib/prisma";
import { ActivityWithTasksAndTimeEntries } from "@/types";
import { TeamMembershipRole } from "@prisma/client";

export type GetBookmarkedActivitiesParams = {
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
      team: {
        teamMemberships: {
          some: {
            userId,
            role: TeamMembershipRole.OWNER,
          },
        },
      },
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
        include: {
          category: true,
        },
      },
    },
  });

  return bookmarkedActivities;
}
