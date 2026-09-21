import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { requireSession } from "./require-session";

describe("requireSession", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("redirects to sign-in when there is no session", async () => {
    authMock.mockResolvedValue(null);

    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("redirects to sign-in when the session carries no user id", async () => {
    authMock.mockResolvedValue({ user: { email: "someone@example.com" } });

    await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("returns the session of the signed-in user", async () => {
    const session = { user: { id: "user-1", email: "someone@example.com" } };
    authMock.mockResolvedValue(session);

    expect(await requireSession()).toBe(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
