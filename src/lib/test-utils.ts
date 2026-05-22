import { prisma } from "@/lib/prisma";
import { TeamMembershipRole } from "@prisma/client";
import type {
  User,
  Team,
  TeamMembership,
  Activity,
  Task,
  Category,
} from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function createUser(
  overrides: Partial<Pick<User, "email">> = {}
): Promise<User> {
  return prisma.user.create({
    data: {
      email: overrides.email ?? faker.internet.email(),
    },
  });
}

export async function createTeam(
  overrides: Partial<Pick<Team, "name">> = {}
): Promise<Team> {
  return prisma.team.create({
    data: {
      name: overrides.name ?? faker.company.name(),
    },
  });
}

export async function createTeamMembership({
  userId,
  teamId,
  role = TeamMembershipRole.OWNER,
}: {
  userId: string;
  teamId: string;
  role?: TeamMembershipRole;
}): Promise<TeamMembership> {
  return prisma.teamMembership.create({
    data: { userId, teamId, role },
  });
}

export async function createOwner(): Promise<{
  user: User;
  team: Team;
  membership: TeamMembership;
}> {
  const user = await createUser();
  const team = await createTeam();
  const membership = await createTeamMembership({
    userId: user.id,
    teamId: team.id,
    role: TeamMembershipRole.OWNER,
  });
  return { user, team, membership };
}

export async function createActivity({
  userId,
  teamId,
  ...overrides
}: {
  userId: string;
  teamId: string;
} & Partial<
  Pick<Activity, "name" | "completedAt" | "deletedAt" | "bookmarkedAt">
>): Promise<Activity> {
  return prisma.activity.create({
    data: {
      name: overrides.name ?? faker.lorem.words(3),
      userId,
      teamId,
      completedAt: overrides.completedAt ?? null,
      deletedAt: overrides.deletedAt ?? null,
      bookmarkedAt: overrides.bookmarkedAt ?? null,
    },
  });
}

export async function createTask({
  activityId,
  ...overrides
}: {
  activityId: string;
} & Partial<
  Pick<Task, "name" | "position" | "durationMs" | "completedAt" | "deletedAt">
>): Promise<Task> {
  return prisma.task.create({
    data: {
      name: overrides.name ?? faker.lorem.words(2),
      activityId,
      position: overrides.position ?? 0,
      durationMs: overrides.durationMs ?? 60_000,
      completedAt: overrides.completedAt ?? null,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
}

export async function createCategory({
  userId,
  teamId,
  ...overrides
}: {
  userId: string;
  teamId: string;
} & Partial<Pick<Category, "name">>): Promise<Category> {
  return prisma.category.create({
    data: {
      name:
        overrides.name ??
        `${faker.lorem.word()}-${faker.string.uuid().slice(0, 8)}`,
      userId,
      teamId,
    },
  });
}
