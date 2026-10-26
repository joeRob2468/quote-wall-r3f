import Link from "next/link";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { UserRole } from "@prisma/client";
import { currentRole } from "@/lib/auth";
import { dashboardNavigation } from "@/config/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The dashboard.",
};

export default async function DashboardPage() {
  const role = await currentRole();
  const items = dashboardNavigation.filter(
    (item) => !item.requiresAdminRole || role === UserRole.ADMIN
  );

  return (
    <>
      <PageHeading title="Dashboard" description="Welcome to the dashboard." />
      <nav className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center rounded-md border p-6 font-medium transition-colors hover:bg-muted/50"
          >
            {item.icon ? <item.icon className="w-5 h-5 mr-3" /> : null}
            {item.title}
          </Link>
        ))}
      </nav>
    </>
  );
}
