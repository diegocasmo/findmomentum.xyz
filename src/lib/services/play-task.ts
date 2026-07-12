import { prisma } from "@/lib/prisma";
import type { TimeEntry } from "@prisma/client";
import { TeamMembershipRole } from "@prisma/client";

type PlayTaskParams = {
  taskId: string;
  userId: string;
};

export async function playTask({
  taskId,
  userId,
}: PlayTaskParams): Promise<TimeEntry> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Ensure user is the owner of the task's activity team and get the activityId
      const task = await tx.task.findFirstOrThrow({
        where: {
          id: taskId,
          completedAt: null,
          deletedAt: null,
          activity: {
            userId,
            completedAt: null,
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
        },
        select: {
          activityId: true,
        },
      });

      // Stop any ongoing time entries for all tasks in the activity
      await tx.timeEntry.updateMany({
        where: {
          task: {
            activityId: task.activityId,
            deletedAt: null,
          },
          stoppedAt: null,
        },
        data: {
          stoppedAt: new Date(),
        },
      });

      return await tx.timeEntry.create({
        data: {
          taskId,
        },
      });
    });
  } catch (error) {
    console.error("Error playing task:", error);
    throw error;
  }
}
