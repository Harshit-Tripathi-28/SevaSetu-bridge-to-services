import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { MobileNav } from '../components/navigation/MobileNav';
import type { NavItem } from '../components/navigation/types';

export interface ApplicationShellProps {
  children?: React.ReactNode;
  navItems: NavItem[];
  sidebarItems?: NavItem[];
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  headerActionArea?: React.ReactNode;
  sidebarTitle?: string;
}

export const ApplicationShell: React.FC<ApplicationShellProps> = ({
  children,
  navItems,
  sidebarItems,
  showSidebar = false,
  headerActionArea,
  sidebarTitle = 'Navigation',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col antialiased selection:bg-primary-100 selection:text-primary-900">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>

      {/* Global Header */}
      <Header
        navItems={navItems}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        actionArea={headerActionArea}
      />

      {/* Responsive Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navItems}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full">
        {/* Optional Reusable Sidebar Framework */}
        {showSidebar && sidebarItems && sidebarItems.length > 0 && (
          <Sidebar
            items={sidebarItems}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            title={sidebarTitle}
          />
        )}

        {/* Content Viewport */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 outline-none"
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Footer */}
      <Footer navItems={navItems} />
    </div>
  );
};
