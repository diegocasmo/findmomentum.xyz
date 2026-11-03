import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/sign-in-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignIn() {
  const session = await auth();

  if (session && session.user) {
    redirect("/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          <Link href="/">Momentum</Link>
        </CardTitle>
        <CardDescription className="text-center">
          Small wins. Big progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
}
