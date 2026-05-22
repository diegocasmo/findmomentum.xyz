import type { Task } from "@prisma/client";
import { TeamMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateTaskParams = {
  name: string;
  userId: string;
  activityId: string;
  durationMs: number;
};

export async function createTask({
  name,
  userId,
  activityId,
  durationMs,
}: CreateTaskParams): Promise<Task> {
  return await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirstOrThrow({
      where: {
        id: activityId,
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
        position: newPosition,
      },
    });
  });
}
