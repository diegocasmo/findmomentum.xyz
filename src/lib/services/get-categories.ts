import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import type { Category } from "@prisma/client";

type GetCategoriesParams = {
  userId: string;
};

export const getCategories = cache(
  async ({
    userId,
  }: GetCategoriesParams): Promise<Category[]> => {
    try {
      return prisma.category.findMany({
        where: {
          userId,
          team: {
            teamMemberships: {
              some: {
                userId,
                role: TeamMembershipRole.OWNER,
              },
            },
          },
        },
        orderBy: {
          name: "asc",
          createdAt: "desc",
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }
);
