import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";

type DeleteCategoryParams = {
  categoryId: string;
  userId: string;
};

export type DeleteCategoryResult = {
  id: string;
  affectedActivitiesCount: number;
};

export async function deleteCategory({
  categoryId,
  userId,
}: DeleteCategoryParams): Promise<DeleteCategoryResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.category.findFirstOrThrow({
        where: {
          id: categoryId,
          team: {
            teamMemberships: {
              some: { userId, role: TeamMembershipRole.OWNER },
            },
          },
        },
      });

      const affectedActivitiesCount = await tx.activityCategory.count({
        where: { categoryId },
      });

      await tx.category.delete({
        where: { id: categoryId },
      });

      return { id: categoryId, affectedActivitiesCount };
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}
