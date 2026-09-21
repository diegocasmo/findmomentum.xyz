import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

// No middleware guards the protected routes, so every protected page and layout
// resolves the session itself and sends signed-out visitors to sign-in.
export async function requireSession(): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  return session;
}
