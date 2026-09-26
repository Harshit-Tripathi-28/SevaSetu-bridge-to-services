import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Wrench,
  Hammer,
  Home,
  Car,
  Layers,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ServiceCategory } from '../../../types';

export interface ServiceCategoryCardProps {
  category: ServiceCategory;
  isSelected?: boolean;
  onSelect?: (category: ServiceCategory) => void;
  className?: string;
  asLink?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Zap,
  Wrench,
  Hammer,
  Home,
  Car,
};

export const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  category,
  isSelected = false,
  onSelect,
  className,
  asLink = true,
}) => {
  const IconComponent = (category.iconName && iconMap[category.iconName]) || Layers;

  const content = (
    <div
      className={cn(
        'group flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        isSelected
          ? 'bg-primary-50/80 border-primary-500 shadow-sm text-primary-950 ring-1 ring-primary-500'
          : 'bg-white border-neutral-200 hover:border-primary-300 hover:shadow-md text-neutral-900',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200',
          isSelected
            ? 'bg-primary-600 text-white shadow-xs'
            : 'bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white'
        )}
      >
        <IconComponent size={22} aria-hidden="true" />
      </div>

      <h3 className="font-semibold text-sm leading-tight text-neutral-900 group-hover:text-primary-700 transition-colors">
        {category.name}
      </h3>

      {category.description && (
        <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to={`/services/${category.slug}`}
        aria-label={`Browse ${category.name} services`}
        className="focus-visible:outline-none block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category)}
      aria-pressed={isSelected}
      className="w-full text-left focus-visible:outline-none"
    >
      {content}
    </button>
  );
};
