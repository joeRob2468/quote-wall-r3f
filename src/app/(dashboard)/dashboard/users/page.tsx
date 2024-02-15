import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users and configure settings.",
};

export default function SettingsPage() {
  return (
    <>
      <h1 className="text-xl font-bold md:text-2xl">Users</h1>
      <p>Manage users and configure settings.</p>
      <div className="flex flex-col pt-8"></div>
    </>
  );
}
