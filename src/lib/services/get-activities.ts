import { prisma } from "@/lib/prisma";
import type {
  ActivityWithTasksAndTimeEntries,
  CompletionStatus,
} from "@/types";
import { type Prisma, TeamMembershipRole } from "@prisma/client";

type GetActivitiesParams = {
  userId: string;
  page?: number;
  limit?: number;
  searchQuery?: string;
  completionStatuses?: CompletionStatus[];
  categoryIds?: string[];
};

type PaginatedActivities = {
  activities: ActivityWithTasksAndTimeEntries[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export async function getActivities({
  userId,
  page = 1,
  limit = 10,
  searchQuery = "",
  completionStatuses = [],
  categoryIds = [],
}: GetActivitiesParams): Promise<PaginatedActivities> {
  const skip = (page - 1) * limit;

  const where: Prisma.ActivityWhereInput = {
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
    ...(searchQuery
      ? {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        }
      : {}),
    ...(completionStatuses.length === 1
      ? { completedAt: completionStatuses[0] === "completed" ? { not: null } : null }
      : {}),
    ...(categoryIds.length > 0
      ? { categories: { some: { categoryId: { in: categoryIds } } } }
      : {}),
  };

  const [totalCount, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          where: {
            deletedAt: null,
            activity: {
              tasks: {
                some: {
                  timeEntries: {
                    some: {
                      stoppedAt: null,
                    },
                  },
                },
              },
            },
          },
          include: {
            timeEntries: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        categories: {
          orderBy: { category: { name: "asc" } },
          include: { category: true },
        },
      },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    activities,
    totalCount,
    totalPages,
    currentPage: page,
  };
}
