import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import type { Category } from "@prisma/client";

type UpdateCategoryParams = {
  categoryId: string;
  name: string;
  userId: string;
};

export async function updateCategory({
  categoryId,
  name,
  userId,
}: UpdateCategoryParams): Promise<Category> {
  try {
    return await prisma.category.update({
      where: {
        id: categoryId,
        team: {
          teamMemberships: {
            some: { userId, role: TeamMembershipRole.OWNER },
          },
        },
      },
      data: { name },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}
