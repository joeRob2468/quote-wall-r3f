"use client";

import { ColumnDef } from "@tanstack/react-table";
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
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "author.name",
    header: "Author",
  },
  {
    accessorKey: "date",
    header: "Date",
    meta: { hideOnMobile: true },
    size: 140,
    cell: ({ row }) => {
      const date = row.original.date;
      if (!date) return;
      
      return new Intl.DateTimeFormat('en-us', {
        dateStyle: "medium"
      }).format(date);
    }
  },
];
