import "@/styles/globals.css";

import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import Providers from "@/providers";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import React from "react";

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
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-zinc-950 font-sans antialiased dark",
            fontSans.variable
          )}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </SessionProvider>
  );
}
