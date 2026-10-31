import { beforeEach, describe, expect, it } from "vitest";
import type { Activity, Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createActivity, createOwner, createTask as insertTask } from "@/lib/test-utils";
import { DEFAULT_TASK_COLOR, TASK_COLORS } from "@/lib/utils/task-colors";
import { createTask } from "./create-task";
import { updateTask } from "./update-task";
import { duplicateTask } from "./duplicate-task";
import { createActivityFromTemplate } from "./create-activity-from-template";

describe("task color persistence", () => {
  let owner: Awaited<ReturnType<typeof createOwner>>;
  let activity: Activity;
  let task: Task;

  beforeEach(async () => {
    owner = await createOwner();
    activity = await createActivity({ userId: owner.user.id, teamId: owner.team.id });
    task = await insertTask({ activityId: activity.id, color: TASK_COLORS[2] });
  });

  const reloadTask = (id: string) => prisma.task.findUniqueOrThrow({ where: { id } });
  const snapshot = async () => ({
    tasks: await prisma.task.findMany({ orderBy: { id: "asc" } }),
    activities: await prisma.activity.findMany({ orderBy: { id: "asc" } }),
  });

  it("persists the selected color and allows tasks to share it", async () => {
    const color = TASK_COLORS[4];
    const created = await createTask({
      activityId: activity.id, userId: owner.user.id,
      name: "Colored task", durationMs: 60000, color,
    });
    expect((await reloadTask(created.id)).color).toBe(color);
    const updated = await updateTask({
      taskId: task.id, userId: owner.user.id,
      name: task.name, durationMs: task.durationMs, color,
    });
    expect(updated.color).toBe(color);
    expect((await reloadTask(task.id)).color).toBe(color);
    expect(created.activityId).toBe(updated.activityId);
  });

  it("defaults new tasks to blue but preserves omitted update colors", async () => {
    const created = await createTask({
      activityId: activity.id, userId: owner.user.id, name: "Default", durationMs: 60000,
    });
    expect((await reloadTask(created.id)).color).toBe(DEFAULT_TASK_COLOR);
    await updateTask({
      taskId: task.id, userId: owner.user.id, name: "Renamed", durationMs: 120000,
    });
    expect(await reloadTask(task.id)).toMatchObject({
      name: "Renamed", durationMs: 120000, color: task.color,
    });
  });

  it.each(["", "#123456", null])(
    "rejects invalid input %s without changing stored data", async (color) => {
      const before = await snapshot();
      // Runtime validation must also protect callers outside TypeScript.
      const input = { name: "Invalid", durationMs: 120000, color: color as string, userId: owner.user.id };
      await expect(createTask({ ...input, activityId: activity.id })).rejects.toThrow();
      await expect(updateTask({ ...input, taskId: task.id })).rejects.toThrow();
      expect(await snapshot()).toEqual(before);
    },
  );

  it("copies a completed task's color without its progress", async () => {
    const color = task.color;
    await prisma.task.update({ where: { id: task.id }, data: { color, completedAt: new Date() } });
    await prisma.timeEntry.create({ data: { taskId: task.id } });
    const source = await reloadTask(task.id);
    const copy = await duplicateTask({ taskId: task.id, userId: owner.user.id });
    expect(copy.id).not.toBe(task.id);
    expect(await reloadTask(copy.id)).toMatchObject({
      name: task.name, durationMs: task.durationMs, activityId: activity.id,
      position: task.position + 1, color, completedAt: null, deletedAt: null,
    });
    expect(await prisma.timeEntry.count({ where: { taskId: copy.id } })).toBe(0);
    expect(await reloadTask(task.id)).toEqual(source);
  });

  it("templates a completed activity with distinct/repeated colors and fresh tasks", async () => {
    const second = await insertTask({
      activityId: activity.id, position: 1, color: task.color, completedAt: new Date(),
    });
    const third = await insertTask({ activityId: activity.id, position: 2, color: TASK_COLORS[4] });
    await insertTask({ activityId: activity.id, position: 3, deletedAt: new Date(), color: TASK_COLORS[5] });
    await prisma.timeEntry.create({ data: { taskId: second.id } });
    await prisma.activity.update({ where: { id: activity.id }, data: { completedAt: new Date() } });
    const source = await snapshot();
    const copy = await createActivityFromTemplate({ activityId: activity.id, userId: owner.user.id });
    const tasks = await prisma.task.findMany({
      where: { activityId: copy.id, deletedAt: null }, orderBy: { position: "asc" },
      include: { timeEntries: true },
    });
    expect(copy.id).not.toBe(activity.id);
    expect(copy.completedAt).toBeNull();
    expect(tasks.map(({ name, durationMs, position, color, completedAt, deletedAt, timeEntries }) => ({
      name, durationMs, position, color, completedAt, deletedAt, timeEntries,
    }))).toEqual([task, second, third].map(({ name, durationMs, position, color }) => ({
      name, durationMs, position, color, completedAt: null, deletedAt: null, timeEntries: [],
    })));
    expect(tasks.every((item) => !source.tasks.some((original) => original.id === item.id))).toBe(true);
    expect(await prisma.task.findMany({ where: { activityId: activity.id }, orderBy: { id: "asc" } }))
      .toEqual(source.tasks);
  });

  it("rejects another user's color edits and copies", async () => {
    const { user } = await createOwner();
    const before = await snapshot();
    await expect(updateTask({
      taskId: task.id, userId: user.id, name: task.name,
      durationMs: task.durationMs, color: TASK_COLORS[4],
    })).rejects.toThrow();
    await expect(duplicateTask({ taskId: task.id, userId: user.id })).rejects.toThrow();
    await expect(createActivityFromTemplate({ activityId: activity.id, userId: user.id })).rejects.toThrow();
    expect(await snapshot()).toEqual(before);
  });
});
