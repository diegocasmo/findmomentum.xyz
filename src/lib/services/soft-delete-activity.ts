import { prisma } from "@/lib/prisma";
import type { Activity } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type SoftDeleteActivityParams = {
  userId: string;
  activityId: string;
};

export async function softDeleteActivity({
  userId,
  activityId,
}: SoftDeleteActivityParams): Promise<Activity> {
  try {
    return await prisma.activity.update({
      where: {
        id: activityId,
        userId,
        deletedAt: null,
        team: teamOwnedBy(userId),
      },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    console.error("Error soft-deleting activity:", error);
    throw error;
  }
}
