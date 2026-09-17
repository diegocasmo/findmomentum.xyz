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
    // Find the source task and ensure the user has permission to access it
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

    // Find the highest position in the activity to place the new task at the end
    const highestPositionTask = await tx.task.findFirst({
      where: {
        activityId: sourceTask.activityId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = highestPositionTask
      ? highestPositionTask.position + 1
      : sourceTask.position + 1;

    return await tx.task.create({
      data: {
        name: sourceTask.name,
        position: newPosition,
        durationMs: sourceTask.durationMs,
        activityId: sourceTask.activityId,
      },
    });
  });
}
