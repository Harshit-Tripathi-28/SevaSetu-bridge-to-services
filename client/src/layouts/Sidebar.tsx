import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import type { NavItem } from '../components/navigation/types';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  title?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  title = 'Platform Menu',
  className,
  ...props
}) => {
  // Close on Escape on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, onCloseMobile]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-neutral-200">
        {!isCollapsed ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 px-2 truncate">
            {title}
          </span>
        ) : (
          <span className="mx-auto w-2 h-2 rounded-full bg-primary-600" aria-hidden="true" />
        )}

        {/* Mobile close button */}
        {isMobileOpen && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
            className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
          className="hidden md:inline-flex items-center justify-center p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Sidebar Navigation">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => isMobileOpen && onCloseMobile && onCloseMobile()}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg text-sm font-medium transition-all group',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )
            }
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <span className="shrink-0 text-current" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </div>

            {!isCollapsed && item.badge && (
              <Badge variant="info" size="sm">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-neutral-200 text-xs text-neutral-600">
        {!isCollapsed ? (
          <div className="text-[11px] text-neutral-600">
            <span>Framework v1.0</span>
          </div>
        ) : (
          <div className="text-center text-[10px] font-mono text-neutral-600">v1</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 bg-white border-r border-neutral-200 transition-all duration-200 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
        aria-label="Sidebar"
        {...props}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Sidebar"
          className="fixed inset-0 z-50 md:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-2xl z-10 border-r border-neutral-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
