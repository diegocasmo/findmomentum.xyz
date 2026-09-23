import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type UpdateTaskPositionParams = {
  taskId: string;
  userId: string;
  newPosition: "top" | "bottom" | string;
};

export async function updateTaskPosition({
  taskId,
  userId,
  newPosition,
}: UpdateTaskPositionParams): Promise<Task> {
  try {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.task.findFirstOrThrow({
        where: {
          id: taskId,
          activity: {
            userId,
            deletedAt: null,
            completedAt: null,
            team: teamOwnedBy(userId),
          },
        },
        include: {
          activity: {
            include: {
              tasks: {
                orderBy: {
                  position: "asc",
                },
                select: {
                  id: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      const tasks = task.activity.tasks;
      let newPositionValue: number;

      if (newPosition === "top") {
        newPositionValue = tasks.length > 0 ? tasks[0].position - 1 : 0;
      } else if (newPosition === "bottom") {
        newPositionValue =
          tasks.length > 0 ? tasks[tasks.length - 1].position + 1 : 0;
      } else {
        const afterTaskIndex = tasks.findIndex((t) => t.id === newPosition);

        if (afterTaskIndex === -1) {
          throw new Error("Invalid afterTaskId provided");
        }

        const afterTask = tasks[afterTaskIndex];
        const nextTask = tasks[afterTaskIndex + 1];
        if (nextTask) {
          newPositionValue = (afterTask.position + nextTask.position) / 2;
        } else {
          newPositionValue = afterTask.position + 1;
        }
      }

      return tx.task.update({
        where: { id: taskId },
        data: { position: newPositionValue },
      });
    });
  } catch (error) {
    console.error("Error updating task position:", error);
    throw error;
  }
}
