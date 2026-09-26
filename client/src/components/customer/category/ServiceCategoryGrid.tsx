import React from 'react';
import { ServiceCategoryCard } from './ServiceCategoryCard';
import { Skeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { cn } from '../../../lib/utils';
import type { ServiceCategory } from '../../../types';

export interface ServiceCategoryGridProps {
  categories: ServiceCategory[];
  isLoading?: boolean;
  selectedSlug?: string;
  onSelectCategory?: (category: ServiceCategory) => void;
  asLink?: boolean;
  className?: string;
}

export const ServiceCategoryGrid: React.FC<ServiceCategoryGridProps> = ({
  categories,
  isLoading = false,
  selectedSlug,
  onSelectCategory,
  asLink = true,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`cat-skel-${idx}`} className="p-5 rounded-xl border border-neutral-200 bg-white space-y-3">
            <Skeleton variant="circular" className="w-12 h-12 mx-auto" />
            <Skeleton variant="text" className="w-2/3 mx-auto" />
            <Skeleton variant="text" className="w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        title="No categories available"
        description="Service categories will be published as they are onboarded to the platform."
        compact
      />
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {categories.map((category) => (
        <ServiceCategoryCard
          key={category.id}
          category={category}
          isSelected={selectedSlug === category.slug}
          onSelect={onSelectCategory}
          asLink={asLink}
        />
      ))}
    </div>
  );
};
