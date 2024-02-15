import { DataTable } from "@/components/ui/data-table";
import { Metadata } from "next";
import { columns } from "./columns";
import { getSafeUsers } from "@/data/user";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users and configure settings.",
};

export default async function SettingsPage() {
  const users = await getSafeUsers();

  return (
    <>
      <h1 className="text-xl font-bold md:text-2xl">Users</h1>
      <p>Manage users and configure settings.</p>
      <div className="flex flex-col py-8">
        <DataTable columns={columns} data={users} />
      </div>
    </>
  );
}
