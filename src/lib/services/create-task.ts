import type { Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";
import { taskColorSchema } from "@/app/schemas/task-color-schema";
import { DEFAULT_TASK_COLOR } from "@/lib/utils/task-colors";

type CreateTaskParams = {
  name: string;
  userId: string;
  activityId: string;
  durationMs: number;
  color?: string;
};

export async function createTask({
  name,
  userId,
  activityId,
  durationMs,
  color = DEFAULT_TASK_COLOR,
}: CreateTaskParams): Promise<Task> {
  const parsedColor = taskColorSchema.parse(color);
  return await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirstOrThrow({
      where: {
        id: activityId,
        userId,
        deletedAt: null,
        completedAt: null,
        team: teamOwnedBy(userId),
      },
      include: {
        tasks: {
          orderBy: {
            position: "desc",
          },
          take: 1,
        },
      },
    });

    const lastTask = activity.tasks[0];
    const newPosition = lastTask ? lastTask.position + 1 : 0;

    return await tx.task.create({
      data: {
        name,
        activityId: activity.id,
        durationMs,
        color: parsedColor,
        position: newPosition,
      },
    });
  });
}
