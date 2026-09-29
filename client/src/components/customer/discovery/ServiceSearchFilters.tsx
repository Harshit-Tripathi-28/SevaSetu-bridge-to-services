import React from 'react';
import { Search, MapPin, Calendar, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Card, CardContent } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import type { ServiceCategory } from '../../../types';

export interface ServiceSearchFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  preferredDate?: string;
  onDateChange?: (value: string) => void;
  preferredTime?: string;
  onTimeChange?: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onReset?: () => void;
  categories: ServiceCategory[];
  className?: string;
}

export const ServiceSearchFilters: React.FC<ServiceSearchFiltersProps> = ({
  keyword,
  onKeywordChange,
  selectedCategory,
  onCategoryChange,
  location,
  onLocationChange,
  preferredDate = '',
  onDateChange,
  preferredTime = '',
  onTimeChange,
  sortBy,
  onSortChange,
  onReset,
  categories,
  className,
}) => {
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const sortOptions = [
    { value: 'recommended', label: 'Best Match (Recommended)' },
    { value: 'experience', label: 'Most Experienced' },
  ];

  return (
    <Card variant="default" padding="none" className={cn('bg-white', className)}>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Primary Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Search service need (e.g. pipe leakage, wiring)..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            leftIcon={<Search size={16} />}
            aria-label="Search service need"
          />

          <Select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categoryOptions}
            aria-label="Filter by Category"
          />

          <Input
            placeholder="Area / Pincode / Landmark..."
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            leftIcon={<MapPin size={16} />}
            aria-label="Service Location"
          />
        </div>

        {/* Secondary Parameters Bar (Date, Time & Sort) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {onDateChange && (
              <div className="w-full sm:w-44">
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  leftIcon={<Calendar size={14} />}
                  aria-label="Preferred Date"
                  className="py-1.5 text-xs"
                />
              </div>
            )}

            {onTimeChange && preferredDate && (
              <div className="w-full sm:w-36">
                <Input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => onTimeChange(e.target.value)}
                  aria-label="Preferred Time"
                  className="py-1.5 text-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-neutral-600">
              <SlidersHorizontal size={14} className="text-neutral-500" />
              <span className="font-medium">Sort by:</span>
              <div className="w-48">
                <Select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  options={sortOptions}
                  aria-label="Sort Results"
                  className="py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {onReset && (
            <div className="self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw size={13} />}
                onClick={onReset}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
