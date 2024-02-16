import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The dashboard.",
};

export default function DashboardPage() {
  return (
    <PageHeading title="Dashboard" description="Welcome to the dashboard." />
  );
}
