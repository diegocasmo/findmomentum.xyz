import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils";
import { z } from "zod";
import { createZodError } from "@/lib/utils/form";

type PrismaErrorMapping = {
  [key: string]: (error: PrismaClientKnownRequestError) => z.ZodError;
};

const CONSTRAINT_MAPPING: Record<string, { field: string; message: string }> =
  {
    categories_team_id_lower_name_key: {
      field: "name",
      message: "A category with this name already exists",
    },
  };

// Prisma 7.x with the PrismaPg driver adapter doesn't surface the violated
// constraint directly on `error.meta.target` — it's nested as a Postgres
// error embedded in `meta.driverAdapterError.cause.originalMessage`, e.g.
// `duplicate key value violates unique constraint "<name>"`. Extract it.
function extractConstraintName(error: PrismaClientKnownRequestError): string | null {
  const meta = error.meta as
    | {
        target?: unknown;
        driverAdapterError?: { cause?: { originalMessage?: string } };
      }
    | undefined;
  if (typeof meta?.target === "string") return meta.target;
  const message = meta?.driverAdapterError?.cause?.originalMessage;
  if (typeof message === "string") {
    const match = message.match(/unique constraint "([^"]+)"/);
    if (match) return match[1];
  }
  return null;
}

const defaultPrismaErrorMapping: PrismaErrorMapping = {
  P2002: (error) => {
    const constraint = extractConstraintName(error);
    if (constraint) {
      const mapping = CONSTRAINT_MAPPING[constraint];
      if (mapping) {
        return createZodError(mapping.message, [mapping.field]);
      }
    }
    const target = error.meta?.target;
    const field = Array.isArray(target) ? target[0] ?? "unknown" : "unknown";
    return createZodError(`A record with this ${field} already exists`, [
      field,
    ]);
  },
};

export function transformPrismaErrorToZodError(
  error: unknown
): z.ZodError | null {
  if (error instanceof PrismaClientKnownRequestError) {
    const errorHandler = defaultPrismaErrorMapping[error.code];
    return errorHandler ? errorHandler(error) : null;
  }
  return null;
}
