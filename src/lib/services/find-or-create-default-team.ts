import { prisma } from "@/lib/prisma";
import { Team, User, TeamMembershipRole } from "@prisma/client";

function getTeamName(email: string): string {
  const [name] = email.split("@");
  return name.charAt(0).toUpperCase() + name.slice(1) + "'s Team";
}

export async function findOrCreateDefaultTeam(userId: string): Promise<Team> {
  try {
    const user: User | null = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const existingTeamMembership = await prisma.teamMembership.findFirst({
      where: { userId },
      include: { team: true },
    });

    if (existingTeamMembership) return existingTeamMembership.team;

    return prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: getTeamName(user.email),
          teamMemberships: {
            create: {
              userId,
              role: TeamMembershipRole.OWNER,
            },
          },
        },
      });

      return newTeam;
    });
  } catch (error) {
    console.error("Error creating default team:", error);
    throw error;
  }
}
