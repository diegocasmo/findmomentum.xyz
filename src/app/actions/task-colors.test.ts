import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createActivity, createOwner, createTask } from "@/lib/test-utils";
import { DEFAULT_TASK_COLOR, TASK_COLORS } from "@/lib/utils/task-colors";
import { requireUserId } from "@/lib/utils/require-user-id";
import { createTaskAction } from "./create-task-action";
import { updateTaskAction } from "./update-task-action";

vi.mock("@/lib/utils/require-user-id", () => ({ requireUserId: vi.fn() }));

describe("task color actions", () => {
  let activity: Activity;
  let task: Task;

  beforeEach(async () => {
    const { user, team } = await createOwner();
    activity = await createActivity({ userId: user.id, teamId: team.id });
    task = await createTask({ activityId: activity.id, color: TASK_COLORS[2] });
    vi.mocked(requireUserId).mockResolvedValue({ success: true, data: user.id });
  });

  function form(color?: string | Blob) {
    const data = new FormData();
    data.set("activityId", activity.id);
    data.set("taskId", task.id);
    data.set("name", "Updated task");
    data.set("durationMs", "60000");
    if (color !== undefined) data.set("color", color);
    return data;
  }

  const snapshot = () => prisma.task.findMany({ orderBy: { id: "asc" } });

  it("returns the selected color from both actions", async () => {
    const color = TASK_COLORS[4];
    const created = await createTaskAction(form(color));
    expect(created).toMatchObject({ success: true, data: { color } });
    expect(await updateTaskAction(form(color))).toMatchObject({ success: true, data: { color } });
  });

  it("accepts legacy forms without resetting an existing color", async () => {
    expect(await createTaskAction(form())).toMatchObject({ success: true, data: { color: DEFAULT_TASK_COLOR } });
    expect(await updateTaskAction(form())).toMatchObject({
      success: true, data: { name: "Updated task", color: task.color },
    });
  });

  it.each(["", "#123456", new File(["#f43f5e"], "color.txt")])(
    "returns a color field error for %s without writes", async (color) => {
      const before = await snapshot();
      const failure = { success: false, errors: { color: { message: expect.any(String) } } };
      expect(await createTaskAction(form(color))).toMatchObject(failure);
      expect(await updateTaskAction(form(color))).toMatchObject(failure);
      expect(await snapshot()).toEqual(before);
    },
  );
});
