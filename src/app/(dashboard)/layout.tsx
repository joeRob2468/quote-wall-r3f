import "@/styles/globals.css";

import React from "react";
import { Sidebar } from "@/components/dashboard/sidebar/sidebar";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = auth();

  return (
    <div className="relative flex flex-col min-h-screen bg-zinc-950">
      {/* Solid header so scrolled content doesn't show through it */}
      <SiteHeader className="bg-zinc-950 border-b border-b-muted pointer-events-auto" />
      <section className="container flex flex-col md:flex-row md:space-x-12">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 py-6 md:py-12 md:pl-64">{children}</div>
      </section>
    </div>
  );
}
