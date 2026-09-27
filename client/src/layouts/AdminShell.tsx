import React, { useState } from 'react';
import { Link, Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  CalendarClock,
  CheckCircle,
  AlertTriangle,
  LifeBuoy,
  FileText,
  Sliders,
  Menu,
  X,
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import type { NavItem } from '../components/navigation/types';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard size={15} /> },
  { label: 'Users', href: '/admin/users', icon: <Users size={15} /> },
  { label: 'Providers', href: '/admin/providers', icon: <Briefcase size={15} /> },
  { label: 'Services', href: '/admin/services', icon: <Layers size={15} /> },
  { label: 'Bookings', href: '/admin/bookings', icon: <CalendarClock size={15} /> },
  { label: 'Verification', href: '/admin/verification', icon: <CheckCircle size={15} /> },
  { label: 'Disputes', href: '/admin/reports', icon: <AlertTriangle size={15} /> },
  { label: 'Support', href: '/admin/support', icon: <LifeBuoy size={15} /> },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: <FileText size={15} /> },
  { label: 'Trust & Safety', href: '/admin/trust-safety', icon: <ShieldAlert size={15} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Sliders size={15} /> },
];

export interface AdminShellProps {
  children?: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Simple breadcrumb derived from path
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 font-sans flex flex-col antialiased selection:bg-primary-100 selection:text-primary-900">
      {/* Skip to Main Content Link for Accessibility */}
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to administrative content
      </a>

      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-neutral-200 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Admin Brand Treatment */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              aria-label="Toggle navigation sidebar"
              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hidden lg:inline-flex"
            >
              <PanelLeft size={18} />
            </button>

            <Link
              to="/admin"
              className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg p-1"
              aria-label="SevaSetu Admin Operations Console"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-900 text-white font-bold text-base shadow-xs select-none">
                <ShieldCheck size={20} className="text-amber-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-neutral-900 leading-tight">
                    SevaSetu
                  </span>
                  <Badge variant="neutral" size="sm" className="bg-neutral-900 text-white text-[10px] py-0 px-1.5 font-bold">
                    OPERATIONS
                  </Badge>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">
                  Trust, Safety &amp; Governance
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Cross-Portal Switcher & Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Switch to Customer Portal Mode */}
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeftRight size={13} />}
                className="text-xs h-8 hidden sm:inline-flex"
              >
                Customer App
              </Button>
            </Link>

            {/* Switch to Provider Console */}
            <Link to="/provider">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Briefcase size={13} />}
                className="text-xs h-8 hidden md:inline-flex"
              >
                Provider Portal
              </Button>
            </Link>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut size={13} />}
                className="text-xs h-8 text-neutral-600 hover:text-red-700"
              >
                Sign Out
              </Button>
            )}

            {/* Mobile Navigation Trigger Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="admin-mobile-navigation"
              className="lg:hidden p-2 text-neutral-700"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            id="admin-mobile-navigation"
            className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-1">
              Admin Navigation
            </div>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/admin'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
                  )
                }
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
              >
                <ArrowLeftRight size={14} />
                <span>Switch to Customer App</span>
              </Link>
              <Link
                to="/provider"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
              >
                <Briefcase size={14} />
                <span>Switch to Provider Console</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin View Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <aside
          aria-label="Admin Operations Sidebar"
          className={cn(
            'hidden lg:flex flex-col shrink-0 border-r border-neutral-200 bg-white py-5 px-3 transition-all duration-200 select-none sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto',
            showSidebar ? 'w-64' : 'w-16 items-center px-2'
          )}
        >
          {showSidebar && (
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
              Governance &amp; Ops
            </div>
          )}

          <nav className="space-y-1 w-full flex-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/admin'}
                title={!showSidebar ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg text-xs font-semibold transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    showSidebar ? 'gap-3 px-3 py-2' : 'justify-center p-2.5',
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  )
                }
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {showSidebar && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {showSidebar && (
            <div className="pt-4 border-t border-neutral-100 text-[11px] text-neutral-400 px-3">
              <div>SevaSetu Operations UI</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Part 7 UI/UX Architecture</div>
            </div>
          )}
        </aside>

        {/* Content View Area */}
        <main
          id="admin-main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 outline-none"
        >
          {/* Breadcrumb Hierarchy */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-neutral-500">
              <li>
                <Link to="/admin" className="hover:text-neutral-900 transition-colors">
                  Admin
                </Link>
              </li>
              {pathSegments.slice(1).map((seg, idx) => {
                const url = `/${pathSegments.slice(0, idx + 2).join('/')}`;
                const isLast = idx === pathSegments.length - 2;
                return (
                  <React.Fragment key={url}>
                    <span className="text-neutral-400">/</span>
                    <li className={cn(isLast ? 'font-semibold text-neutral-900 capitalize' : 'capitalize hover:text-neutral-900')}>
                      {isLast ? seg.replace('-', ' ') : <Link to={url}>{seg.replace('-', ' ')}</Link>}
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>

          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
