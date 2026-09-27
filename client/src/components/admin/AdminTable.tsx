import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '../../lib/utils';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface AdminTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  mobileCardRenderer?: (item: T, isSelected: boolean) => React.ReactNode;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching the specified filters.',
  emptyAction,
  sortBy,
  sortDirection = 'asc',
  onSort,
  selectedIds,
  onSelectRow,
  onSelectAll,
  page = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  mobileCardRenderer,
}: AdminTableProps<T>): React.ReactElement {
  const isAllSelected =
    data.length > 0 && selectedIds && data.every((item) => selectedIds.includes(keyExtractor(item)));

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-neutral-600 mt-4">Loading operational records...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-error-200 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertCircle className="text-error-500 mb-3" size={36} />
        <h3 className="text-base font-semibold text-neutral-900">Unable to load data</h3>
        <p className="text-sm text-neutral-600 max-w-md mt-1">{error}</p>
      </div>
    );
  }

  // 3. Empty State
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
      {/* ======================================================== */}
      {/* DESKTOP & TABLET: Semantic Table View                     */}
      {/* ======================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-700 divide-y divide-neutral-200">
          <thead className="bg-neutral-50 text-xs uppercase font-semibold text-neutral-600 tracking-wider">
            <tr>
              {onSelectAll && (
                <th scope="col" className="w-12 px-4 py-3.5">
                  <span className="sr-only">Select All Rows</span>
                  <Checkbox
                    checked={isAllSelected}
                    onChange={onSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isCurrentSort = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn('px-4 py-3.5 select-none', col.headerClassName)}
                    aria-sort={
                      isCurrentSort
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1.5 font-semibold text-neutral-700 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-1 py-0.5 -mx-1"
                      >
                        <span>{col.header}</span>
                        {isCurrentSort ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp size={14} className="text-primary-600" />
                          ) : (
                            <ArrowDown size={14} className="text-primary-600" />
                          )
                        ) : (
                          <ArrowUpDown size={13} className="text-neutral-400" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {data.map((item, index) => {
              const id = keyExtractor(item);
              const isSelected = selectedIds?.includes(id) ?? false;

              return (
                <tr
                  key={id}
                  className={cn(
                    'transition-colors hover:bg-neutral-50/80',
                    isSelected && 'bg-primary-50/40'
                  )}
                >
                  {onSelectRow && (
                    <td className="w-12 px-4 py-3.5">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onSelectRow(id)}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3.5 align-middle', col.className)}>
                      {col.render(item, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* MOBILE: Responsive Card / Stacked View                    */}
      {/* ======================================================== */}
      <div className="md:hidden divide-y divide-neutral-200">
        {data.map((item, index) => {
          const id = keyExtractor(item);
          const isSelected = selectedIds?.includes(id) ?? false;

          if (mobileCardRenderer) {
            return (
              <div
                key={id}
                className={cn('p-4 transition-colors', isSelected && 'bg-primary-50/40')}
              >
                {mobileCardRenderer(item, isSelected)}
              </div>
            );
          }

          return (
            <div
              key={id}
              className={cn(
                'p-4 space-y-2.5 transition-colors',
                isSelected && 'bg-primary-50/40'
              )}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Item #{index + 1}
                </span>
                {onSelectRow && (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onSelectRow(id)}
                    aria-label={`Select item ${index + 1}`}
                  />
                )}
              </div>
              <div className="space-y-1.5">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-2 text-xs">
                    <span className="font-medium text-neutral-500 shrink-0">{col.header}:</span>
                    <div className="text-right text-neutral-800 break-words">{col.render(item, index)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* PAGINATION CONTROLS                                       */}
      {/* ======================================================== */}
      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
        <div className="flex items-center gap-1.5 font-medium">
          <span>
            Showing <strong className="text-neutral-900">{data.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-neutral-900">{Math.min(page * pageSize, totalItems || data.length)}</strong> of{' '}
            <strong className="text-neutral-900">{totalItems || data.length}</strong> entries
          </span>
        </div>

        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous Page"
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="px-2 font-medium text-neutral-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next Page"
              className="h-7 px-2 text-xs"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
