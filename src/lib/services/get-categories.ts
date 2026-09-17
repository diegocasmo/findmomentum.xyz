import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { CategoryOption } from "@/types";
import { teamOwnedBy } from "@/lib/utils/team-owned-by";

type GetCategoriesParams = {
  userId: string;
};

export const getCategories = cache(
  async ({
    userId,
  }: GetCategoriesParams): Promise<CategoryOption[]> => {
    try {
      return prisma.category.findMany({
        where: {
          userId,
          team: teamOwnedBy(userId),
        },
        orderBy: [
          { name: "asc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }
);
