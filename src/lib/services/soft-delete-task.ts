import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type SoftDeleteTaskParams = {
  userId: string;
  taskId: string;
};

export async function softDeleteTask({
  userId,
  taskId,
}: SoftDeleteTaskParams): Promise<Task> {
  try {
    return await prisma.task.update({
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
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error soft-deleting task:", error);
    throw error;
  }
}
