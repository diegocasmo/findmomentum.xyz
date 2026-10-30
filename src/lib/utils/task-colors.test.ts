import { describe, it, expect } from "vitest";

import { TASK_COLORS, getTaskColors } from "./task-colors";

describe("getTaskColors", () => {
  it("gives the last arc a color unlike both of its neighbors", () => {
    const colors = getTaskColors(TASK_COLORS.length + 1);
    const last = colors[colors.length - 1];

    expect(last).not.toBe(colors[0]);
    expect(last).not.toBe(colors[colors.length - 2]);
  });
});
