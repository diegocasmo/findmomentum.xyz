import { type Prisma, TeamMembershipRole } from "@prisma/client";

// The authorization boundary every service query relies on: only a team's OWNER
// membership may read or mutate rows that belong to that team.
export function teamOwnedBy(userId: string): Prisma.TeamWhereInput {
  return {
    teamMemberships: {
      some: {
        userId,
        role: TeamMembershipRole.OWNER,
      },
    },
  };
}
