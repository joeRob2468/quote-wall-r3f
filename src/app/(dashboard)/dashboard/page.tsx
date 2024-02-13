import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The dashboard.",
};

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold md:text-4xl">Dashboard</h1>
      <p>Welcome to the dashboard.</p>
    </>
  );
}
