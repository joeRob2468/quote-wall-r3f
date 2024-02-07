import "@/styles/globals.css";

import { Metadata } from "next";
import React from "react";
import { SessionProvider } from "next-auth/react";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { fontSans } from "@/lib/fonts";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = auth();

  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased dark",
            fontSans.variable
          )}
        >
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
          </div>
        </body>
      </html>
    </SessionProvider>
  );
}
