import { describe, it, expect } from "vitest";
import { findOrCreateDefaultTeam } from "./find-or-create-default-team";
import { prisma } from "@/lib/prisma";
import {
  createUser,
  createTeam,
  createTeamMembership,
} from "@/lib/test-utils";
import { TeamMembershipRole } from "@prisma/client";

describe("findOrCreateDefaultTeam", () => {
  it("throws when the user does not exist", async () => {
    const nonExistentId = "clxxxxxxxxxxxxxxxxxxxxxxxx";
    await expect(findOrCreateDefaultTeam(nonExistentId)).rejects.toThrow(
      `User with ID ${nonExistentId} not found`
    );
  });

  it("creates a new team named after the capitalized email local part", async () => {
    const user = await createUser({ email: "alice@example.com" });
    const team = await findOrCreateDefaultTeam(user.id);
    expect(team.name).toBe("Alice's Team");
  });

  it("creates an OWNER TeamMembership for the user on the new team", async () => {
    const user = await createUser({ email: "bob@example.com" });
    const team = await findOrCreateDefaultTeam(user.id);
    const membership = await prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId: team.id } },
    });
    expect(membership).not.toBeNull();
    expect(membership!.role).toBe(TeamMembershipRole.OWNER);
  });

  it("only capitalizes the first character of the email local part", async () => {
    const user = await createUser({ email: "test.user@example.com" });
    const team = await findOrCreateDefaultTeam(user.id);
    expect(team.name).toBe("Test.user's Team");
  });

  it("returns the existing team when user already has a membership", async () => {
    const user = await createUser();
    const existingTeam = await createTeam({ name: "Existing Team" });
    await createTeamMembership({
      userId: user.id,
      teamId: existingTeam.id,
      role: TeamMembershipRole.OWNER,
    });
    const result = await findOrCreateDefaultTeam(user.id);
    expect(result.id).toBe(existingTeam.id);
    expect(result.name).toBe("Existing Team");
  });

  it("does not create additional teams when one already exists", async () => {
    const user = await createUser();
    const existingTeam = await createTeam();
    await createTeamMembership({
      userId: user.id,
      teamId: existingTeam.id,
    });
    const beforeCount = await prisma.team.count();
    await findOrCreateDefaultTeam(user.id);
    const afterCount = await prisma.team.count();
    expect(afterCount).toBe(beforeCount);
  });
});
