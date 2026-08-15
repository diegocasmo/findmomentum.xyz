import { describe, it, expect } from "vitest";
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { transformErrorToFieldErrors } from "./prisma-error-handler";

describe("transformErrorToFieldErrors", () => {
  it("falls back to a root error for an error Prisma does not map", () => {
    expect(transformErrorToFieldErrors(new Error("boom"))).toEqual({
      root: {
        type: "manual",
        message: "An unexpected error occurred. Please try again.",
      },
    });
  });

  it("maps a violated category name constraint to a name field error", () => {
    const error = new PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: {
        modelName: "Category",
        driverAdapterError: {
          cause: {
            originalMessage:
              'duplicate key value violates unique constraint "categories_team_id_lower_name_key"',
          },
        },
      },
    });

    expect(transformErrorToFieldErrors(error)).toEqual({
      name: {
        type: "manual",
        message: "A category with this name already exists",
      },
    });
  });
});
