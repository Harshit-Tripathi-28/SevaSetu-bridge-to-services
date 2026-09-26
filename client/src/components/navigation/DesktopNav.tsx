import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import type { NavItem } from './types';

export interface DesktopNavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ items, className, ...props }) => {
  return (
    <nav
      aria-label="Main Navigation"
      className={cn('hidden md:flex items-center gap-1', className)}
      {...props}
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
              isActive
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )
          }
        >
          {item.icon && (
            <span className="shrink-0 text-current" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
          {item.badge && (
            <Badge variant="info" size="sm" className="ml-1">
              {item.badge}
            </Badge>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
