import { getSafeUserById, getUserById } from "@/data/user";

import { ErrorWrapper } from "@/components/error-wrapper";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { RoleGate } from "@/components/auth/role-gate";
import { UserEditForm } from "@/components/dashboard/users/user-edit-form";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit User",
  description: "Edit user.",
};

interface EditPageProps {
  params: {
    id: string;
  };
}
export default async function EditPage({ params }: EditPageProps) {
  const user = await getSafeUserById(params.id);
  if (!user) {
    return (
      <ErrorWrapper
        description="No valid user was found - go back and try again."
        buttonHref="/dashboard/users"
      />
    );
  }

  return (
    <RoleGate allowedRole={UserRole.ADMIN}>
      <PageHeading
        title="Edit User"
        description="Manage user settings and set email preferences."
      />
      <div className="flex flex-col pt-8">
        <UserEditForm user={user} />
      </div>
    </RoleGate>
  );
}
