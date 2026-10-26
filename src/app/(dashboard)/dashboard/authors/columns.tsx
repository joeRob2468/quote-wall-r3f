"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Author } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal } from "@/components/icons";

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
  {
    id: "actions",
    meta: { hideOnMobile: true },
    size: 64,
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
                href={rowHref(author)}
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
