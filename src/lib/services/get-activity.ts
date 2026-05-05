import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import type { ActivityWithTasksAndTimeEntries } from "@/types";

export type GetActivityParams = {
  id: string;
  userId: string;
};

export async function getActivity({
  id,
  userId,
}: GetActivityParams): Promise<ActivityWithTasksAndTimeEntries> {
  try {
    return await prisma.activity.findFirstOrThrow({
      where: {
        id,
        userId,
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
  } catch (error) {
    console.error("Error fetching activity:", error);
    throw error;
  }
}
