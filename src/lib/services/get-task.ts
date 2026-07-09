import { prisma } from "@/lib/prisma";
import { TaskWithTimeEntries } from "@/types";
import { TeamMembershipRole } from "@prisma/client";

type GetTaskParams = {
  userId: string;
  taskId: string;
};

export async function getTask({
  userId,
  taskId,
}: GetTaskParams): Promise<TaskWithTimeEntries> {
  return prisma.task.findFirstOrThrow({
    where: {
      id: taskId,
      deletedAt: null,
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
    include: {
      timeEntries: true,
    },
  });
}
