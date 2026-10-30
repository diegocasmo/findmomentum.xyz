import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { TaskWithTimeEntries } from "@/types";

import { getTimerSegments, MS_PER_MIN } from "./time";

const NOW = new Date("2026-01-01T12:00:00Z");

function buildTask(
  overrides: Partial<TaskWithTimeEntries> & { id: string; durationMs: number }
): TaskWithTimeEntries {
  return {
    name: overrides.id,
    position: 0,
    activityId: "activity-1",
    completedAt: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: null,
    timeEntries: [],
    ...overrides,
  };
}

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * MS_PER_MIN);
}

describe("getTimerSegments", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns no segments for no tasks", () => {
    expect(getTimerSegments([])).toEqual([]);
  });

  it("fills the whole ring with one task", () => {
    const [segment] = getTimerSegments([
      buildTask({ id: "a", durationMs: 5 * MS_PER_MIN }),
    ]);

    expect(segment).toEqual({ taskId: "a", start: 0, length: 1, fillLength: 1 });
  });

  it("sizes segments by duration and covers the ring with their gaps", () => {
    const segments = getTimerSegments([
      buildTask({ id: "a", durationMs: 1 * MS_PER_MIN }),
      buildTask({ id: "b", durationMs: 3 * MS_PER_MIN }),
    ]);

    expect(segments[0].start).toBeCloseTo(0.005);
    expect(segments[0].length).toBeCloseTo(0.24);
    expect(segments[1].start).toBeCloseTo(0.255);
    expect(segments[1].length).toBeCloseTo(0.74);
  });

  it("keeps a very short task's length positive next to its gap", () => {
    const [tiny] = getTimerSegments([
      buildTask({ id: "a", durationMs: 1000 }),
      buildTask({ id: "b", durationMs: 120 * MS_PER_MIN }),
    ]);

    expect(tiny.length).toBeGreaterThan(0);
  });

  it("drains only the tasks that ran, in any order", () => {
    const [first, second] = getTimerSegments([
      buildTask({ id: "a", durationMs: 10 * MS_PER_MIN }),
      buildTask({
        id: "b",
        durationMs: 10 * MS_PER_MIN,
        timeEntries: [
          {
            id: "entry-1",
            taskId: "b",
            startedAt: minutesAgo(5),
            stoppedAt: null,
            createdAt: NOW,
            updatedAt: null,
          },
        ],
      }),
    ]);

    expect(first.fillLength).toBeCloseTo(first.length);
    expect(second.fillLength).toBeCloseTo(second.length / 2);
  });

  it("never fills past the segment when the client clock is behind", () => {
    const [segment] = getTimerSegments([
      buildTask({
        id: "a",
        durationMs: 1 * MS_PER_MIN,
        timeEntries: [
          {
            id: "entry-1",
            taskId: "a",
            startedAt: minutesAgo(-0.5),
            stoppedAt: null,
            createdAt: NOW,
            updatedAt: null,
          },
        ],
      }),
      buildTask({ id: "b", durationMs: 1 * MS_PER_MIN }),
    ]);

    expect(segment.fillLength).toBe(segment.length);
  });

  it("draws a completed task as a full segment", () => {
    const [segment] = getTimerSegments([
      buildTask({
        id: "a",
        durationMs: 1 * MS_PER_MIN,
        completedAt: NOW,
        timeEntries: [
          {
            id: "entry-1",
            taskId: "a",
            startedAt: minutesAgo(1),
            stoppedAt: NOW,
            createdAt: NOW,
            updatedAt: null,
          },
        ],
      }),
      buildTask({ id: "b", durationMs: 1 * MS_PER_MIN }),
    ]);

    expect(segment.fillLength).toBe(segment.length);
  });
});
