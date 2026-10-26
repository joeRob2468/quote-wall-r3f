import { DataTable } from "@/components/ui/data-table";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { columns, rowHref } from "./columns";
import { getSafeUsers } from "@/data/user";

export const metadata: Metadata = {
  title: "Users",
  description: "Manage users and configure settings.",
};

export default async function SettingsPage() {
  const users = await getSafeUsers();

  return (
    <RoleGate allowedRole={UserRole.ADMIN}>
      <PageHeading
        title="Users"
        description="Manage users and configure settings."
      />
      <div className="flex flex-col py-8">
        <DataTable columns={columns} rowHref={rowHref} data={users} />
      </div>
    </RoleGate>
  );
}
