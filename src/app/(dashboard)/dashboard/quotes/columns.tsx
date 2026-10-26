"use client";

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
import { Quote } from "@prisma/client";

export const rowHref = (quote: Quote) => `/dashboard/quotes/${quote.id}/edit`;

export const columns: ColumnDef<Quote>[] = [
  {
    accessorKey: "body",
    header: "Quote",
  },
  {
    accessorKey: "context",
    header: "Context",
  },
  {
    accessorKey: "author.name",
    header: "Author",
    size: 180,
  },
  {
    accessorKey: "date",
    header: "Date",
    size: 140,
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return;
      
      return new Intl.DateTimeFormat('en-us', {
        dateStyle: "medium"
      }).format(date);
    }
  },
  {
    id: "actions",
    size: 64,
    cell: ({ row }) => {
      const quote = row.original;

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
                href={rowHref(quote)}
                className="cursor-pointer"
              >
                Edit Quote
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
