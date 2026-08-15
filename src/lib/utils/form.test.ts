import { describe, it, expect } from "vitest";
import { createRootErrors } from "./form";

describe("createRootErrors", () => {
  it("returns a manual root field error carrying the message", () => {
    expect(createRootErrors("User not authenticated")).toEqual({
      root: { type: "manual", message: "User not authenticated" },
    });
  });
});
