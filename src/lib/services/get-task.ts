import { prisma } from "@/lib/prisma";
import { TaskWithTimeEntries } from "@/types";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

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
        team: teamOwnedBy(userId),
      },
    },
    include: {
      timeEntries: true,
    },
  });
}
