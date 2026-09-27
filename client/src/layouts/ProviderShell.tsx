import React, { useState } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  CalendarClock,
  Wrench,
  User,
  Wallet,
  Star,
  Menu,
  X,
  ArrowLeftRight,
  Shield,
  PanelLeft,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { NotificationBadge } from '../components/notifications';
import { cn } from '../lib/utils';
import type { NavItem } from '../components/navigation/types';

export const PROVIDER_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/provider', icon: <LayoutDashboard size={15} /> },
  { label: 'Requests', href: '/provider/requests', icon: <Inbox size={15} /> },
  { label: 'Jobs', href: '/provider/jobs', icon: <Briefcase size={15} /> },
  { label: 'Messages', href: '/provider/messages', icon: <MessageSquare size={15} /> },
  { label: 'Availability', href: '/provider/availability', icon: <CalendarClock size={15} /> },
  { label: 'Services', href: '/provider/services', icon: <Wrench size={15} /> },
  { label: 'Profile', href: '/provider/profile', icon: <User size={15} /> },
  { label: 'Earnings', href: '/provider/earnings', icon: <Wallet size={15} /> },
  { label: 'Reviews', href: '/provider/reviews', icon: <Star size={15} /> },
  { label: 'Alerts', href: '/provider/notifications', icon: <Bell size={15} /> },
];

export interface ProviderShellProps {
  children?: React.ReactNode;
}

export const ProviderShell: React.FC<ProviderShellProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col antialiased selection:bg-primary-100 selection:text-primary-900">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#provider-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to provider content
      </a>

      {/* Provider Header */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xs border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Provider Brand Treatment */}
          <div className="flex items-center gap-3">
            <Link
              to="/provider"
              className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg p-1"
              aria-label="SevaSetu Provider Portal Home"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 text-white font-bold text-base shadow-xs select-none">
                S
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-neutral-900 leading-tight">
                    SevaSetu
                  </span>
                  <Badge variant="info" size="sm" className="text-[10px] py-0 px-1.5 font-bold">
                    PARTNER
                  </Badge>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">
                  Service Provider Console
                </span>
              </div>
            </Link>
          </div>

          {/* Provider Desktop Navigation Links */}
          <nav
            aria-label="Provider Portal Navigation"
            className="hidden xl:flex items-center gap-1"
          >
            {PROVIDER_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/provider'}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  )
                }
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Action Area & Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Messages Link */}
            <Link
              to="/provider/messages"
              title="Provider Messages"
              aria-label="Provider Messages"
              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <MessageSquare size={18} />
            </Link>

            {/* Quick Notifications Link */}
            <Link
              to="/provider/notifications"
              title="Notifications & Alerts"
              aria-label="Provider Notifications"
              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <NotificationBadge count={2} size={18} />
            </Link>

            {/* Switch to Customer Portal Mode */}
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeftRight size={13} />}
                className="text-xs h-8"
              >
                <span className="hidden sm:inline">Switch to</span> Customer Mode
              </Button>
            </Link>

            {/* Switch to Operations Console */}
            <Link to="/admin">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Shield size={13} />}
                className="text-xs h-8 hidden md:inline-flex"
              >
                Admin
              </Button>
            </Link>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant={showSidebar ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<PanelLeft size={14} />}
              onClick={() => setShowSidebar((prev) => !prev)}
              aria-label="Toggle provider sidebar"
              className="hidden lg:inline-flex xl:hidden"
            >
              Menu
            </Button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle provider menu"
              aria-expanded={isMobileMenuOpen}
              className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1">
            <div className="pb-2 mb-2 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wider">Partner Menu</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Shield size={12} className="text-emerald-600" />
                Verified Portal
              </span>
            </div>
            {PROVIDER_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/provider'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex w-full">
        {/* Optional Provider Sidebar on medium screens */}
        {showSidebar && (
          <aside className="hidden lg:block xl:hidden w-56 border-r border-neutral-200 bg-white p-4 space-y-1 shrink-0">
            <div className="pb-2 mb-2 border-b border-neutral-100 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Navigation
            </div>
            {PROVIDER_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/provider'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </aside>
        )}

        {/* Content Viewport */}
        <main
          id="provider-main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 outline-none"
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Provider Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">SevaSetu Partner Portal</span>
            <span>•</span>
            <span>Local Services Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/provider/profile" className="hover:text-neutral-800 transition-colors">
              Profile
            </Link>
            <Link to="/provider/availability" className="hover:text-neutral-800 transition-colors">
              Operating Hours
            </Link>
            <Link to="/" className="hover:text-neutral-800 transition-colors">
              Customer Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
