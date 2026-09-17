import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

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
        team: teamOwnedBy(userId),
      },
      data: { name },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}
