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

      const activity = await tx.activity.create({
        data: {
          name,
          description,
          teamId: teamMembership.teamId,
          userId,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (categoryIds && categoryIds.length > 0) {
        const uniqueIds = Array.from(new Set(categoryIds));
        const count = await tx.category.count({
          where: { id: { in: uniqueIds }, teamId: teamMembership.teamId },
        });
        if (count !== uniqueIds.length) {
          throw new Error("One or more categories do not belong to your team");
        }
        await tx.activityCategory.createMany({
          data: uniqueIds.map((categoryId) => ({
            activityId: activity.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
        return tx.activity.findFirstOrThrow({
          where: { id: activity.id },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });
      }

      return activity;
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
}
