import { describe, it, expect, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

import { requireUserId } from "./require-user-id";

describe("requireUserId", () => {
  it("fails with a root error when there is no session", async () => {
    authMock.mockResolvedValue(null);

    expect(await requireUserId()).toEqual({
      success: false,
      errors: { root: { type: "manual", message: "User not authenticated" } },
    });
  });

  it("fails with a root error when the session carries no user id", async () => {
    authMock.mockResolvedValue({ user: { email: "someone@example.com" } });

    expect(await requireUserId()).toEqual({
      success: false,
      errors: { root: { type: "manual", message: "User not authenticated" } },
    });
  });

  it("returns the id of the signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", email: "someone@example.com" },
    });

    expect(await requireUserId()).toEqual({ success: true, data: "user-1" });
  });
});
