import { prisma } from "@/lib/prisma";
import type { Activity } from "@prisma/client";
import { TeamMembershipRole } from "@prisma/client";

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
      // Ensure user is the owner of the activity's team, all non-deleted tasks are completed,
      // and there is at least one non-deleted completed task
      const activity = await tx.activity.findFirstOrThrow({
        where: {
          userId,
          id: activityId,
          deletedAt: null,
          completedAt: null,
          team: {
            teamMemberships: {
              some: {
                userId,
                role: TeamMembershipRole.OWNER,
              },
            },
          },
          // Tasks are either deleted or completed
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

      // Update the activity to mark it as completed
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
