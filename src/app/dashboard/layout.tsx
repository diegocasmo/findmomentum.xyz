import { TopNav } from "@/components/top-nav";
import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";
import { NotificationManager } from "@/components/notification-manager";
import { BottomNav } from "@/components/bottom-nav";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/services/get-categories";
import type React from "react";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) redirect("/auth/sign-in");
  const userId = session.user.id;
  const categories = await getCategories({ userId });

  return (
    <SessionProvider session={session}>
      <NotificationManager />
      <div className="flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-grow pt-6 mb-[82px]">
          <div className="container max-w-7xl mx-auto px-2">{children}</div>
        </main>
        <BottomNav categories={categories} />
      </div>
    </SessionProvider>
  );
}
