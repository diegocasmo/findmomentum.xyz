import { prisma } from "@/lib/prisma";
import type { ActivityWithTasksAndTimeEntries } from "@/types";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type GetActivityParams = {
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
        team: teamOwnedBy(userId),
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
  } catch (error) {
    console.error("Error fetching activity:", error);
    throw error;
  }
}
