import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import type { NavItem } from './types';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, items }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key & manage body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus close button on open
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl border-l border-neutral-200',
          'flex flex-col z-10 transform transition-transform duration-200 ease-in-out'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white font-bold text-sm shadow-xs">
              S
            </div>
            <span className="font-bold text-base text-neutral-900 tracking-tight">SevaSetu</span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Mobile Menu Links">
          <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider px-3 py-2">
            Navigation
          </div>
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                )
              }
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="shrink-0 text-current" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="info" size="sm">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Drawer Footer Framework */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
          <p className="font-medium text-neutral-700">SevaSetu Platform</p>
          <p className="text-[11px] text-neutral-600 mt-0.5">Application Shell &amp; Navigation System</p>
        </div>
      </div>
    </div>
  );
};
