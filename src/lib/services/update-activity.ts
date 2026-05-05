import type { ActivityWithCategories } from "@/types";
import { TeamMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpdateActivityParams = {
  activityId: string;
  name?: string;
  description?: string;
  userId: string;
  categoryIds?: string[];
};

export async function updateActivity({
  activityId,
  name,
  description,
  userId,
  categoryIds,
}: UpdateActivityParams): Promise<ActivityWithCategories> {
  try {
    return await prisma.$transaction(async (tx) => {
      const activity = await tx.activity.findFirstOrThrow({
        where: {
          id: activityId,
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
      });

      const uniqueIds = categoryIds !== undefined ? Array.from(new Set(categoryIds)) : null;

      if (uniqueIds !== null) {
        const ownedCategories = await tx.category.findMany({
          where: { id: { in: uniqueIds }, teamId: activity.teamId },
          select: { id: true },
        });
        if (ownedCategories.length !== uniqueIds.length) {
          throw new Error(
            "One or more categories do not belong to your team"
          );
        }
      }

      return tx.activity.update({
        where: { id: activityId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(uniqueIds !== null && {
            categories: {
              deleteMany: {},
              createMany: {
                data: uniqueIds.map((categoryId) => ({ categoryId })),
                skipDuplicates: true,
              },
            },
          }),
        },
        include: {
          categories: { include: { category: true } },
        },
      });
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    throw error;
  }
}
