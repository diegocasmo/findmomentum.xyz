import { prisma } from "@/lib/prisma";
import { type Task, TeamMembershipRole } from "@prisma/client";

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
      // Find the task and ensure the user has permission to update it
      const task = await tx.task.findFirstOrThrow({
        where: {
          id: taskId,
          activity: {
            userId,
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
          // Position the new task between the after task and the next task
          newPositionValue = (afterTask.position + nextTask.position) / 2;
        } else {
          // If there's no next task, we're inserting at the end
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
