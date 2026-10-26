"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SafeUser } from "@/types/user";
import { UserRole } from "@prisma/client";

export const rowHref = (user: SafeUser) => `/dashboard/users/${user.id}/edit`;

export const columns: ColumnDef<SafeUser>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "role",
    header: "Role",
    size: 160,
    cell: ({ row }) => {
      const role = row.getValue("role");
      return (
        <>
          {role === UserRole.ADMIN
            ? "Administrator"
            : role === UserRole.PENDING
              ? "Pending Approval"
              : "User"}
        </>
      );
    },
  },
];
