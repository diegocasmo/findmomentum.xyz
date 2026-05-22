import { describe, it, expect, beforeEach } from "vitest";
import { completeTask } from "./complete-task";
import { prisma } from "@/lib/prisma";
import {
  createOwner,
  createActivity,
  createTask as insertTask,
} from "@/lib/test-utils";
import type { User, Team, Activity, Task } from "@prisma/client";

describe("completeTask", () => {
  let user: User;
  let team: Team;
  let activity: Activity;
  let task: Task;

  beforeEach(async () => {
    ({ user, team } = await createOwner());
    activity = await createActivity({ userId: user.id, teamId: team.id });
    task = await insertTask({ activityId: activity.id });
  });

  it("sets completedAt on the task", async () => {
    const before = new Date();
    const result = await completeTask({ taskId: task.id, userId: user.id });
    expect(result.completedAt).not.toBeNull();
    expect(result.completedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });

  it("stops the single open time entry by setting its stoppedAt", async () => {
    // Schema has @@unique([taskId, stoppedAt]); at most one open entry per task
    // is realistic (multiple stoppedAt:null rows are tolerated by Postgres NULL
    // semantics, but completeTask's updateMany would collide if it had to stop
    // two at the same instant — that scenario is out of scope).
    const entry = await prisma.timeEntry.create({
      data: { taskId: task.id, startedAt: new Date() },
    });
    const before = new Date();
    await completeTask({ taskId: task.id, userId: user.id });
    const updated = await prisma.timeEntry.findUnique({
      where: { id: entry.id },
    });
    expect(updated!.stoppedAt).not.toBeNull();
    expect(updated!.stoppedAt!.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });

  it("does not modify already-stopped time entries", async () => {
    const stoppedAt = new Date("2024-01-01T00:00:00Z");
    const stoppedEntry = await prisma.timeEntry.create({
      data: { taskId: task.id, startedAt: new Date(), stoppedAt },
    });
    await completeTask({ taskId: task.id, userId: user.id });
    const reloaded = await prisma.timeEntry.findUnique({
      where: { id: stoppedEntry.id },
    });
    expect(reloaded!.stoppedAt!.getTime()).toBe(stoppedAt.getTime());
  });

  it("returns the completed Task record", async () => {
    const result = await completeTask({ taskId: task.id, userId: user.id });
    expect(result.id).toBe(task.id);
    expect(result.completedAt).not.toBeNull();
  });

  it("throws when the user is not the owner of the task's team", async () => {
    const { user: otherUser } = await createOwner();
    await expect(
      completeTask({ taskId: task.id, userId: otherUser.id })
    ).rejects.toThrow();
  });

  it("throws when the task has already been completed", async () => {
    await prisma.task.update({
      where: { id: task.id },
      data: { completedAt: new Date() },
    });
    await expect(
      completeTask({ taskId: task.id, userId: user.id })
    ).rejects.toThrow();
  });

  it("throws when the activity has been soft-deleted", async () => {
    await prisma.activity.update({
      where: { id: activity.id },
      data: { deletedAt: new Date() },
    });
    await expect(
      completeTask({ taskId: task.id, userId: user.id })
    ).rejects.toThrow();
  });
});
