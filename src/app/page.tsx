import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.findmomentum.xyz",
  },
};

export default async function Home() {
  const session = await auth();

  if (session && session.user) {
    redirect("/dashboard");
  }

  return (
    <SessionProvider session={session}>
      <StructuredData />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Hero />
          <Features />
        </main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
