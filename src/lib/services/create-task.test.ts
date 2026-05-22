import { describe, it, expect, beforeEach } from "vitest";
import { createTask } from "./create-task";
import {
  createOwner,
  createActivity,
  createTask as insertTask,
} from "@/lib/test-utils";
import type { User, Team, Activity } from "@prisma/client";

describe("createTask", () => {
  let user: User;
  let team: Team;
  let activity: Activity;

  beforeEach(async () => {
    ({ user, team } = await createOwner());
    activity = await createActivity({ userId: user.id, teamId: team.id });
  });

  it("assigns position 0 when the activity has no tasks", async () => {
    const task = await createTask({
      name: "First task",
      userId: user.id,
      activityId: activity.id,
      durationMs: 30_000,
    });
    expect(task.position).toBe(0);
  });

  it("assigns position lastTask.position + 1 when tasks exist", async () => {
    await insertTask({ activityId: activity.id, position: 0 });
    await insertTask({ activityId: activity.id, position: 1 });
    const task = await createTask({
      name: "Third task",
      userId: user.id,
      activityId: activity.id,
      durationMs: 30_000,
    });
    expect(task.position).toBe(2);
  });

  it("uses the highest existing position even with non-sequential positions", async () => {
    await insertTask({ activityId: activity.id, position: 0 });
    await insertTask({ activityId: activity.id, position: 5 });
    const task = await createTask({
      name: "New task",
      userId: user.id,
      activityId: activity.id,
      durationMs: 30_000,
    });
    expect(task.position).toBe(6);
  });

  it("creates a task with the correct name, activityId, and durationMs", async () => {
    const task = await createTask({
      name: "My task",
      userId: user.id,
      activityId: activity.id,
      durationMs: 45_000,
    });
    expect(task.name).toBe("My task");
    expect(task.activityId).toBe(activity.id);
    expect(task.durationMs).toBe(45_000);
  });

  it("throws when the user is not the owner of the activity's team", async () => {
    const { user: otherUser } = await createOwner();
    await expect(
      createTask({
        name: "Unauthorized",
        userId: otherUser.id,
        activityId: activity.id,
        durationMs: 30_000,
      })
    ).rejects.toThrow();
  });

  it("throws when the activity has been soft-deleted", async () => {
    const deleted = await createActivity({
      userId: user.id,
      teamId: team.id,
      deletedAt: new Date(),
    });
    await expect(
      createTask({
        name: "On deleted",
        userId: user.id,
        activityId: deleted.id,
        durationMs: 30_000,
      })
    ).rejects.toThrow();
  });

  it("throws when the activity has been completed", async () => {
    const completed = await createActivity({
      userId: user.id,
      teamId: team.id,
      completedAt: new Date(),
    });
    await expect(
      createTask({
        name: "On completed",
        userId: user.id,
        activityId: completed.id,
        durationMs: 30_000,
      })
    ).rejects.toThrow();
  });
});
