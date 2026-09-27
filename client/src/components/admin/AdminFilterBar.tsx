import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface AdminFilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
}

export interface AdminFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: AdminFilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  onResetFilters?: () => void;
  totalFilteredCount?: number;
  rightAction?: React.ReactNode;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records by name, ID, or phone...',
  filters = [],
  onFilterChange,
  onResetFilters,
  totalFilteredCount,
  rightAction,
}) => {
  const hasActiveFilters =
    searchQuery.trim().length > 0 || filters.some((f) => f.value && f.value !== 'all' && f.value !== '');

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-4 mb-5 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            leftIcon={<Search size={16} className="text-neutral-400" />}
            aria-label="Search filter"
            className="h-9.5 text-xs sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dynamic Select Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <div key={filter.key} className="min-w-[130px] sm:min-w-[150px] flex-1 sm:flex-initial">
                <Select
                  value={filter.value}
                  onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
                  options={filter.options}
                  aria-label={filter.label}
                  className="h-9.5 text-xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* Reset & Right Custom Action */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {hasActiveFilters && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              leftIcon={<RotateCcw size={13} />}
              className="text-xs h-9 text-neutral-600 hover:text-neutral-900"
            >
              Reset
            </Button>
          )}

          {rightAction}
        </div>
      </div>

      {/* Filter status summary line */}
      {typeof totalFilteredCount === 'number' && (
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            {hasActiveFilters ? (
              <span>Active filters applied &bull; Showing {totalFilteredCount} matches</span>
            ) : (
              <span>All records &bull; {totalFilteredCount} total items</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
