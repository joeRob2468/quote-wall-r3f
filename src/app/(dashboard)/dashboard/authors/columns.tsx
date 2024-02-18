"use client";

import { Author, UserRole } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal } from "@/components/icons";
import { SafeUser } from "@/types/user";

export const columns: ColumnDef<Author>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "user",
    header: "User",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const author = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/authors/${author.id}/edit`}
                className="cursor-pointer"
              >
                Edit Author
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
