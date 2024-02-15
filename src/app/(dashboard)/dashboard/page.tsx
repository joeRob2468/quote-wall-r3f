import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The dashboard.",
};

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-xl font-extrabold md:text-2xl">Dashboard</h1>
      <p>Welcome to the dashboard.</p>
    </>
  );
}
