import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import type { CategoryOption } from "@/types";

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
