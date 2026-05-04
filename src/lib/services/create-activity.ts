import type { ActivityWithCategories } from "@/types";
import { TeamMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateActivityParams = {
  name: string;
  description: string;
  userId: string;
  categoryIds?: string[];
};

export async function createActivity({
  name,
  description,
  userId,
  categoryIds,
}: CreateActivityParams): Promise<ActivityWithCategories> {
  try {
    return await prisma.$transaction(async (tx) => {
      const teamMembership = await tx.teamMembership.findFirstOrThrow({
        where: { userId, role: TeamMembershipRole.OWNER },
        select: { teamId: true },
      });

      const uniqueIds = categoryIds ? Array.from(new Set(categoryIds)) : null;

      if (uniqueIds !== null) {
        const ownedCategories = await tx.category.findMany({
          where: { id: { in: uniqueIds }, teamId: teamMembership.teamId },
          select: { id: true },
        });
        if (ownedCategories.length !== uniqueIds.length) {
          throw new Error("One or more categories do not belong to your team");
        }
      }

      return tx.activity.create({
        data: {
          name,
          description,
          teamId: teamMembership.teamId,
          userId,
          ...(uniqueIds !== null && {
            categories: {
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
    console.error("Error creating activity:", error);
    throw error;
  }
}
