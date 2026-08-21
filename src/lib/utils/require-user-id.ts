import { auth } from "@/lib/auth";
import { createRootErrors } from "@/lib/utils/form";
import type { ActionResult } from "@/types";

// Returns an ActionResult so the failure branch can be returned as-is by the
// Server Action that called it.
export async function requireUserId(): Promise<ActionResult<string>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      errors: createRootErrors("User not authenticated"),
    };
  }

  return { success: true, data: session.user.id };
}
