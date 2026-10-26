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
import { KeyboardEvent, MouseEvent } from "react";
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

// Rough average glyph width for text-sm Inter, plus p-4 on both sides
const CHAR_WIDTH_EM = 0.6;
const CELL_PADDING = "2rem";
// Longer values wrap/clamp instead of widening the column further
const MAX_FIT_CHARS = 28;

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

  // The first column takes whatever space is left. Other columns use their
  // explicit `size`, or fit their longest value across all rows (not just
  // the current page) so widths don't change while paging.
  const getColumnWidths = () => {
    const rows = table.getCoreRowModel().rows;
    const widths: Record<string, string | number | undefined> = {};

    table.getAllLeafColumns().forEach((column, index) => {
      if (index === 0) return;
      if (column.columnDef.size) {
        widths[column.id] = column.columnDef.size;
        return;
      }

      const header = column.columnDef.header;
      let longest = typeof header === "string" ? header.length : 0;
      rows.forEach((row) => {
        const value = row.getValue(column.id);
        if (typeof value === "string" || typeof value === "number") {
          longest = Math.max(longest, String(value).length);
        }
      });

      const chars = Math.min(longest, MAX_FIT_CHARS);
      widths[column.id] = `calc(${chars * CHAR_WIDTH_EM}em + ${CELL_PADDING})`;
    });

    return widths;
  };
  const columnWidths = getColumnWidths();

  const { pageIndex, pageSize } = table.getState().pagination;
  const rowCount = table.getRowModel().rows.length;
  // Skip padding when everything fits on one page
  const emptyRows =
    table.getPageCount() > 1 || pageIndex > 0 ? pageSize - rowCount : 0;

  const openRow = (
    event: MouseEvent | KeyboardEvent,
    row: TData
  ) => {
    if (!rowHref) return;
    // Leave any buttons or links inside a cell to do their own thing
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && target.closest("a, button")) return;

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
                    style={{ width: columnWidths[header.column.id] }}
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
                  className={cn(
                    rowHref &&
                      "cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
                  )}
                  // Rows are focusable so keyboard users can Tab to one and
                  // press Enter to open it
                  tabIndex={rowHref ? 0 : undefined}
                  onClick={(event) => openRow(event, row.original)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openRow(event, row.original);
                  }}
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
