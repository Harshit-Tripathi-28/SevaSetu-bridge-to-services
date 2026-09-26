import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { DesktopNav } from '../components/navigation/DesktopNav';
import type { NavItem } from '../components/navigation/types';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  navItems: NavItem[];
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  actionArea?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  navItems,
  isMobileMenuOpen,
  onToggleMobileMenu,
  actionArea,
  className,
  ...props
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xs border-b border-neutral-200 transition-colors',
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Treatment */}
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg p-1 transition-opacity hover:opacity-90"
          aria-label="SevaSetu Home"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white font-bold text-base shadow-xs select-none">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-neutral-900 leading-tight">
              SevaSetu
            </span>
            <span className="text-[10px] text-neutral-600 font-medium tracking-wide uppercase">
              Bridge to Services
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation */}
        <div className="hidden md:flex items-center flex-1 justify-center max-w-xl">
          <DesktopNav items={navItems} />
        </div>

        {/* Action Area Framework & Mobile Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {actionArea && (
            <div className="hidden sm:flex items-center gap-2">
              {actionArea}
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
