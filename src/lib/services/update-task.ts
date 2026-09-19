import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type UpdateTaskParams = {
  userId: string;
  taskId: string;
  name: string;
  durationMs: number;
};

export async function updateTask({
  userId,
  taskId,
  name,
  durationMs,
}: UpdateTaskParams): Promise<Task> {
  try {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirstOrThrow({
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

      return await tx.task.update({
        where: { id: task.id },
        data: { name, durationMs },
      });
    });
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}
