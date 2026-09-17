import { prisma } from "@/lib/prisma";
import type { TimeEntry } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type PauseTaskParams = {
  taskId: string;
  userId: string;
};

export async function pauseTask({
  taskId,
  userId,
}: PauseTaskParams): Promise<TimeEntry | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      // Ensure user is the owner of the task's activity team
      await tx.task.findFirstOrThrow({
        where: {
          id: taskId,
          deletedAt: null,
          completedAt: null,
          activity: {
            userId,
            deletedAt: null,
            completedAt: null,
            team: teamOwnedBy(userId),
          },
        },
      });

      const timeEntry = await tx.timeEntry.findFirstOrThrow({
        where: {
          taskId,
          stoppedAt: null,
        },
      });

      return await tx.timeEntry.update({
        where: {
          id: timeEntry.id,
        },
        data: {
          stoppedAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.error("Error pausing task:", error);
    throw error;
  }
}
