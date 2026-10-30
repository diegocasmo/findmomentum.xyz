import { describe, it, expect } from "vitest";

import { TASK_COLORS, getTaskColors } from "./task-colors";

describe("getTaskColors", () => {
  it("returns no colors for no tasks", () => {
    expect(getTaskColors(0)).toEqual([]);
  });

  it("assigns palette colors in order", () => {
    expect(getTaskColors(3)).toEqual(TASK_COLORS.slice(0, 3));
  });

  it("never gives neighbors the same color, including last and first", () => {
    for (let count = 2; count <= TASK_COLORS.length * 3 + 1; count++) {
      const colors = getTaskColors(count);
      colors.forEach((color, i) => {
        expect(color).not.toBe(colors[(i + 1) % count]);
      });
    }
  });
});
