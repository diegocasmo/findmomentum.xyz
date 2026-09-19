import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type CompleteTaskParams = {
  taskId: string;
  userId: string;
};

export async function completeTask({
  taskId,
  userId,
}: CompleteTaskParams): Promise<Task> {
  return await prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.task.findFirstOrThrow({
      where: {
        id: taskId,
        deletedAt: null,
        completedAt: null,
        activity: {
          userId,
          deletedAt: null,
          team: teamOwnedBy(userId),
        },
      },
    });

    const completedTask = await tx.task.update({
      where: { id: taskId },
      data: { completedAt: now },
    });

    await tx.timeEntry.updateMany({
      where: {
        taskId,
        stoppedAt: null,
      },
      data: {
        stoppedAt: now,
      },
    });

    return completedTask;
  });
}
