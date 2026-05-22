import { describe, it, expect } from "vitest";
import { createCategory } from "./create-category";
import {
  createUser,
  createOwner,
  createCategory as insertCategory,
} from "@/lib/test-utils";

describe("createCategory", () => {
  it("throws when the user has no OWNER team membership", async () => {
    const user = await createUser();
    await expect(
      createCategory({ name: "Work", userId: user.id })
    ).rejects.toThrow();
  });

  it("creates a category with the correct name, teamId, and userId", async () => {
    const { user, team } = await createOwner();
    const category = await createCategory({ name: "Health", userId: user.id });
    expect(category.name).toBe("Health");
    expect(category.teamId).toBe(team.id);
    expect(category.userId).toBe(user.id);
  });

  it("allows two different teams to each have a category with the same name", async () => {
    const { user: user1 } = await createOwner();
    const { user: user2 } = await createOwner();
    await expect(
      createCategory({ name: "Work", userId: user1.id })
    ).resolves.not.toThrow();
    await expect(
      createCategory({ name: "Work", userId: user2.id })
    ).resolves.not.toThrow();
  });

  // Regression canary for migration
  // 20260430204410_categories_case_insensitive_unique:
  // CREATE UNIQUE INDEX categories_team_id_lower_name_key
  //   ON categories (team_id, lower(name)).
  // Prisma surfaces the violation as a P2002 error.
  it("rejects a second category whose name differs only in case", async () => {
    const { user, team } = await createOwner();
    await insertCategory({ userId: user.id, teamId: team.id, name: "Work" });
    const err = await createCategory({ name: "work", userId: user.id }).catch(
      (e) => e
    );
    expect((err as { code?: string }).code).toBe("P2002");
  });

  it("rejects a mixed-case variant of an existing category name", async () => {
    const { user, team } = await createOwner();
    await insertCategory({
      userId: user.id,
      teamId: team.id,
      name: "learning",
    });
    const err = await createCategory({
      name: "Learning",
      userId: user.id,
    }).catch((e) => e);
    expect((err as { code?: string }).code).toBe("P2002");
  });
});
