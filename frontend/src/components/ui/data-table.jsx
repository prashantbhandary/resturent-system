import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { cn } from '../../lib/utils';

/**
 * Reusable, sortable / filterable / paginated table built on TanStack Table.
 *
 * Props:
 *  - columns: TanStack column defs
 *  - data: array of rows
 *  - loading: shows skeleton rows
 *  - searchKey / searchPlaceholder: enables a global text filter box
 *  - pageSize: rows per page (default 10)
 *  - empty: { icon, title, description } passed to EmptyState
 *  - toolbar: optional ReactNode rendered on the right of the search bar
 */
export function DataTable({
  columns,
  data = [],
  loading = false,
  searchKey,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  empty,
  toolbar,
  className,
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const colCount = columns.length;
  const showToolbar = Boolean(searchKey || toolbar);

  return (
    <div className={cn('w-full', className)}>
      {showToolbar && (
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {searchKey ? (
            <div className="relative max-w-xs flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-xs text-muted-foreground">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-2.5 text-left font-medium',
                        header.column.columnDef.meta?.align === 'right' && 'text-right',
                        header.column.columnDef.meta?.align === 'center' && 'text-center'
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ChevronUp size={13} />
                          ) : sorted === 'desc' ? (
                            <ChevronDown size={13} />
                          ) : (
                            <ArrowUpDown size={12} className="opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState
                    title={empty?.title ?? 'No results'}
                    description={empty?.description}
                    icon={empty?.icon}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 py-3',
                        cell.column.columnDef.meta?.align === 'right' && 'text-right',
                        cell.column.columnDef.meta?.align === 'center' && 'text-center'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={15} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
