import { z } from "zod";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormSetError,
  FieldError,
} from "react-hook-form";

export function setFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: FieldErrors<T>
) {
  Object.entries(errors).forEach(([field, error]) => {
    if (error) {
      const path = field as Path<T>;
      setError(path, error as FieldError);
    }
  });
}

export function parseZodErrors<T extends z.ZodType<FieldValues>>(
  result: z.ZodSafeParseError<z.infer<T>> | z.ZodError
): FieldErrors<z.infer<T>> {
  const zodError = result instanceof z.ZodError ? result : result.error;
  return zodError.issues.reduce((acc, issue) => {
    const path = issue.path.join(".");
    if (path) {
      (acc as Record<string, FieldError>)[path] = {
        type: "manual",
        message: issue.message,
      };
    }
    return acc;
  }, {} as FieldErrors<z.infer<T>>);
}

export function createZodError(
  message: string,
  path: (string | number)[] = []
): z.ZodError {
  return new z.ZodError([
    {
      code: z.ZodIssueCode.custom,
      path,
      message,
    },
  ]);
}
