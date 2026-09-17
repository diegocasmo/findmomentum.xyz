import { describe, it, expect } from "vitest";
import { TeamMembershipRole } from "@prisma/client";

import { teamOwnedBy } from "./team-owned-by";

describe("teamOwnedBy", () => {
  it("matches teams where the user holds an OWNER membership", () => {
    expect(teamOwnedBy("user-1")).toEqual({
      teamMemberships: {
        some: {
          userId: "user-1",
          role: TeamMembershipRole.OWNER,
        },
      },
    });
  });

  it("does not widen the filter to other membership roles", () => {
    const filter = teamOwnedBy("user-1");

    expect(filter.teamMemberships).not.toHaveProperty("every");
    expect(filter.teamMemberships).not.toHaveProperty("none");
  });
});
