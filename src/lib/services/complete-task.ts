import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { TeamMembershipRole } from "@prisma/client";

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

    // Ensure user is the owner of the task's activity team
    await tx.task.findFirstOrThrow({
      where: {
        id: taskId,
        deletedAt: null,
        completedAt: null,
        activity: {
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
