"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SignOutForm() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await signOut({ redirect: false });
        // Perform a hard refresh by redirecting to the root URL
        window.location.href = "/";
      } catch (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isPending}
      variant="ghost"
      className="flex w-full justify-start py-1.5 px-2"
    >
      <LogOut className="h-4 w-4 mr-2" />
      <span>{isPending ? "Signing out..." : "Sign out"}</span>
    </Button>
  );
}
