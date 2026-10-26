"use client";

import { Author } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export const rowHref = (author: Author) => `/dashboard/authors/${author.id}/edit`;

export const columns: ColumnDef<Author>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "user.name",
    header: "User",
  },
];
