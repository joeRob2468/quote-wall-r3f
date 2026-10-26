"use client";

import {
  ColumnDef,
  RowData,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "./button";
import { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Fits two lines of text-sm plus p-4 padding, so every row is the same height
const ROW_HEIGHT = "h-[72px]";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    // Drop the column below md so the table fits a phone without scrolling
    hideOnMobile?: boolean;
  }
}

const mobileClass = (hideOnMobile?: boolean) =>
  hideOnMobile ? "hidden md:table-cell" : undefined;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowHref?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowHref,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const rowCount = table.getRowModel().rows.length;
  // Skip padding when everything fits on one page
  const emptyRows =
    table.getPageCount() > 1 || pageIndex > 0 ? pageSize - rowCount : 0;

  const onRowClick = (event: MouseEvent, row: TData) => {
    if (!rowHref) return;
    // Leave buttons, links and the actions menu (portaled, but its events
    // still bubble here through React) to do their own thing
    const target = event.target as HTMLElement;
    if (target.closest("a, button, [role=menuitem], [role=menu]")) return;

    const href = rowHref(row);
    if (event.metaKey || event.ctrlKey) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table className="table-fixed md:min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={mobileClass(
                      header.column.columnDef.meta?.hideOnMobile
                    )}
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(rowHref && "cursor-pointer")}
                  onClick={(event) => onRowClick(event, row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        ROW_HEIGHT,
                        mobileClass(cell.column.columnDef.meta?.hideOnMobile)
                      )}
                    >
                      <div className="line-clamp-2 max-h-10 break-words">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
            {/* Pad short pages so the table height (and pagination) stays put */}
            {Array.from({ length: emptyRows }, (_, i) => (
              <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className={ROW_HEIGHT} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </>
  );
}
