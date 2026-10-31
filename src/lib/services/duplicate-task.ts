import type { Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type DuplicateTaskParams = {
  taskId: string;
  userId: string;
};

export async function duplicateTask({
  taskId,
  userId,
}: DuplicateTaskParams): Promise<Task> {
  return await prisma.$transaction(async (tx) => {
    const sourceTask = await tx.task.findFirstOrThrow({
      where: {
        id: taskId,
        deletedAt: null,
        activity: {
          userId,
          deletedAt: null,
          completedAt: null,
          team: teamOwnedBy(userId),
        },
      },
    });

    const highestPositionTask = await tx.task.findFirstOrThrow({
      where: {
        activityId: sourceTask.activityId,
      },
      orderBy: {
        position: "desc",
      },
    });

    return await tx.task.create({
      data: {
        name: sourceTask.name,
        color: sourceTask.color,
        position: highestPositionTask.position + 1,
        durationMs: sourceTask.durationMs,
        activityId: sourceTask.activityId,
      },
    });
  });
}
