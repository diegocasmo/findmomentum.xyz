import type { Activity } from "@prisma/client";
import { TeamMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateActivityFromTemplateParams = {
  activityId: string;
  userId: string;
};

export async function createActivityFromTemplate({
  activityId,
  userId,
}: CreateActivityFromTemplateParams): Promise<Activity> {
  try {
    return await prisma.$transaction(async (tx) => {
      const sourceActivity = await tx.activity.findFirstOrThrow({
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
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
          },
          categories: {
            select: { categoryId: true },
          },
        },
      });

      const created = await tx.activity.create({
        data: {
          name: sourceActivity.name,
          description: sourceActivity.description
            ? sourceActivity.description
            : null,
          teamId: sourceActivity.teamId,
          userId: userId,
          tasks: {
            create: sourceActivity.tasks.map((task) => ({
              name: task.name,
              position: task.position,
              durationMs: task.durationMs,
            })),
          },
        },
      });

      if (sourceActivity.categories.length > 0) {
        await tx.activityCategory.createMany({
          data: sourceActivity.categories.map(({ categoryId }) => ({
            activityId: created.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });
  } catch (error) {
    console.error("Error creating activity from template:", error);
    throw error;
  }
}
