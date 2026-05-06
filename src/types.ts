import type { Prisma, Category } from "@prisma/client";
import type { FieldErrors } from "react-hook-form";

export type ActivityWithTasksAndTimeEntries = Prisma.ActivityGetPayload<{
  include: {
    tasks: {
      include: {
        timeEntries: true;
      };
    };
    categories: {
      include: {
        category: true;
      };
    };
  };
}>;

export type ActivityWithCategories = Prisma.ActivityGetPayload<{
  include: {
    categories: {
      include: {
        category: true;
      };
    };
  };
}>;

export type CategoryOption = Pick<Category, "id" | "name">;

export type TaskWithTimeEntries = Prisma.TaskGetPayload<{
  include: {
    timeEntries: true;
  };
}>;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; errors: FieldErrors };

export type OtpCredentials = {
  email: string;
  otp: string;
};

export type ActivityContribution = {
  date: string;
  count: number;
};

export type CompletionStatus = "all" | "completed" | "incomplete";
