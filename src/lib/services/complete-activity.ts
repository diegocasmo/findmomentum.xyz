import { prisma } from "@/lib/prisma";
import type { Activity } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type CompleteActivityParams = {
  activityId: string;
  userId: string;
};

export async function completeActivity({
  activityId,
  userId,
}: CompleteActivityParams): Promise<Activity> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Every non-deleted task must be completed, and at least one must exist
      const activity = await tx.activity.findFirstOrThrow({
        where: {
          userId,
          id: activityId,
          deletedAt: null,
          completedAt: null,
          team: teamOwnedBy(userId),
          tasks: {
            every: {
              OR: [
                { deletedAt: { not: null } },
                { completedAt: { not: null } },
              ],
            },
          },
        },
        include: {
          tasks: {
            where: {
              deletedAt: null,
              completedAt: { not: null },
            },
          },
        },
      });

      if (activity.tasks.length === 0) {
        throw new Error(
          "Activity must have at least one non-deleted completed task"
        );
      }

      return await tx.activity.update({
        where: { id: activityId },
        data: { completedAt: new Date() },
      });
    });
  } catch (error) {
    console.error("Error completing activity:", error);
    throw error;
  }
}
