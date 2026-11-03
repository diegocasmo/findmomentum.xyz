import type React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SetTimezoneCookie } from "@/components/set-timezone-cookie";
import "@/app/globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.findmomentum.xyz"),
  title: {
    default: "Momentum | Track Daily Progress with Small Wins",
    template: "%s | Momentum",
  },
  description:
    "Celebrate daily progress and build momentum with small wins. Track your activities, visualize your progress, and stay motivated every day.",
  keywords: [
    "daily progress tracker",
    "small wins",
    "productivity app",
    "habit tracker",
    "activity tracker",
    "progress visualization",
    "momentum building",
    "goal tracking",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.findmomentum.xyz",
    siteName: "Momentum",
    title: "Momentum | Track Daily Progress with Small Wins",
    description:
      "Celebrate daily progress and build momentum with small wins. Track your activities, visualize your progress, and stay motivated every day.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Momentum - Track Daily Progress with Small Wins",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Momentum | Track Daily Progress with Small Wins",
    description:
      "Celebrate daily progress and build momentum with small wins. Track your activities, visualize your progress, and stay motivated every day.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const resolvedTheme = themeCookie === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      className={resolvedTheme}
      style={{ colorScheme: resolvedTheme }}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <SetTimezoneCookie />
          <TooltipProvider>
            <div className="container max-w-7xl mx-auto px-2">{children}</div>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
