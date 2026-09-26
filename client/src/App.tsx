import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import {
  Home,
  Search,
  Sparkles,
  CalendarClock,
  Activity,
  Layers,
  Layout,
  PlusCircle,
  ArrowLeft,
  PanelLeft,
  Briefcase,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { ApplicationShell } from './layouts/ApplicationShell';
import { ProviderShell } from './layouts/ProviderShell';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import { NotificationBadge } from './components/notifications';
import {
  CustomerHomePage,
  ServiceDiscoveryPage,
  ServiceDetailPage,
  ProviderProfilePage as CustomerProviderProfilePage,
  RequestServicePage,
  CustomerActivityPage,
} from './pages/customer';
import {
  ProviderOverviewPage,
  ProviderRequestsPage,
  ProviderRequestDetailPage,
  ProviderJobsPage,
  ProviderJobDetailPage,
  ProviderAvailabilityPage,
  ProviderServicesPage,
  ProviderProfilePage,
  ProviderEarningsPage,
  ProviderReviewsPage,
} from './pages/provider';
import {
  PaymentPage,
  InvoicePage,
  CustomerReviewPage,
} from './pages/transaction';
import {
  MessagesPage,
  NotificationsPage,
} from './pages/communication';
import { ShellPreview } from './pages/ShellPreview';
import { DesignSystemPreview } from './pages/DesignSystemPreview';
import { HealthMonitor } from './pages/HealthMonitor';
import type { NavItem } from './components/navigation/types';

// ==========================================
// Customer Portal Layout Wrapper
// ==========================================
const CustomerLayout: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home size={15} /> },
    { label: 'Find Services', href: '/services', icon: <Search size={15} /> },
    { label: 'Request Service', href: '/request', icon: <Sparkles size={15} /> },
    { label: 'Activity', href: '/activity', icon: <CalendarClock size={15} /> },
    { label: 'Messages', href: '/messages', icon: <MessageSquare size={15} /> },
    { label: 'Alerts', href: '/notifications', icon: <Bell size={15} /> },
    { label: 'Partner Portal', href: '/provider', icon: <Briefcase size={15} /> },
    { label: 'Health & DB', href: '/health', icon: <Activity size={15} /> },
    { label: 'Design System', href: '/design-system', icon: <Layers size={15} /> },
  ];

  const sidebarItems: NavItem[] = [
    { label: 'Customer Home', href: '/', icon: <Home size={15} /> },
    { label: 'Browse Services', href: '/services', icon: <Search size={15} /> },
    { label: 'Request Service', href: '/request', icon: <Sparkles size={15} /> },
    { label: 'My Activity', href: '/activity', icon: <CalendarClock size={15} /> },
    { label: 'Messages', href: '/messages', icon: <MessageSquare size={15} /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell size={15} /> },
    { label: 'Partner Portal', href: '/provider', icon: <Briefcase size={15} /> },
    { label: 'System Health', href: '/health', icon: <Activity size={15} /> },
    { label: 'Design System', href: '/design-system', icon: <Layers size={15} /> },
    { label: 'Shell Layout', href: '/shell-preview', icon: <Layout size={15} /> },
  ];

  return (
    <ApplicationShell
      navItems={navItems}
      sidebarItems={sidebarItems}
      showSidebar={showSidebar}
      sidebarTitle="Customer Navigation"
      headerActionArea={
        <div className="flex items-center gap-2">
          {/* Quick Messages Icon Link */}
          <Link
            to="/messages"
            title="Messages"
            aria-label="Direct Messages"
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <MessageSquare size={18} />
          </Link>

          {/* Quick Notifications Icon Link */}
          <Link
            to="/notifications"
            title="Notifications"
            aria-label="Service Notifications"
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <NotificationBadge count={2} size={18} />
          </Link>

          <Link to="/provider">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Briefcase size={13} />}
              className="hidden sm:inline-flex text-xs h-8"
            >
              Partner Portal
            </Button>
          </Link>

          <Link to="/request">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />} className="text-xs h-8">
              Request Service
            </Button>
          </Link>

          <Button
            variant={showSidebar ? 'secondary' : 'ghost'}
            size="sm"
            leftIcon={<PanelLeft size={14} />}
            onClick={() => setShowSidebar((prev) => !prev)}
            aria-label="Toggle sidebar navigation"
            className="hidden lg:inline-flex text-xs h-8"
          >
            {showSidebar ? 'Hide Menu' : 'Sidebar'}
          </Button>
        </div>
      }
    >
      <Outlet />
    </ApplicationShell>
  );
};

// ==========================================
// Root App with Customer & Provider Shells
// ==========================================
export const App: React.FC = () => {
  const [previewSidebar, setPreviewSidebar] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* 1. Service Provider Experience Routes      */}
        {/* ========================================== */}
        <Route path="/provider" element={<ProviderShell />}>
          <Route index element={<ProviderOverviewPage />} />
          <Route path="requests" element={<ProviderRequestsPage />} />
          <Route path="requests/:id" element={<ProviderRequestDetailPage />} />
          <Route path="jobs" element={<ProviderJobsPage />} />
          <Route path="jobs/:id" element={<ProviderJobDetailPage />} />
          <Route path="availability" element={<ProviderAvailabilityPage />} />
          <Route path="services" element={<ProviderServicesPage />} />
          <Route path="profile" element={<ProviderProfilePage />} />
          <Route path="earnings" element={<ProviderEarningsPage />} />
          <Route path="reviews" element={<ProviderReviewsPage />} />
          <Route path="messages" element={<MessagesPage userRole="provider" />} />
          <Route path="messages/:conversationId" element={<MessagesPage userRole="provider" />} />
          <Route path="notifications" element={<NotificationsPage userRole="provider" />} />
        </Route>

        {/* ========================================== */}
        {/* 2. Customer Portal Experience Routes       */}
        {/* ========================================== */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/services" element={<ServiceDiscoveryPage />} />
          <Route path="/services/:category" element={<ServiceDiscoveryPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/provider/:id" element={<CustomerProviderProfilePage />} />
          <Route path="/request" element={<RequestServicePage />} />
          <Route path="/activity" element={<CustomerActivityPage />} />

          {/* Part 6 Transaction & Communication Routes */}
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/invoice/:invoiceId" element={<InvoicePage userRole="customer" />} />
          <Route path="/reviews/:bookingId" element={<CustomerReviewPage />} />
          <Route path="/messages" element={<MessagesPage userRole="customer" />} />
          <Route path="/messages/:conversationId" element={<MessagesPage userRole="customer" />} />
          <Route path="/notifications" element={<NotificationsPage userRole="customer" />} />

          {/* Foundation & Architecture Views */}
          <Route
            path="/shell-preview"
            element={
              <ShellPreview
                showSidebar={previewSidebar}
                onToggleSidebar={() => setPreviewSidebar(!previewSidebar)}
              />
            }
          />
          <Route path="/design-system" element={<DesignSystemPreview />} />
          <Route path="/health" element={<HealthMonitor />} />

          {/* 404 Catch-All */}
          <Route
            path="*"
            element={
              <div className="flex-1 flex items-center justify-center p-6">
                <EmptyState
                  title="Page Not Found"
                  description="The requested page does not exist within the customer or provider portal."
                  action={
                    <div className="flex items-center gap-3">
                      <Link to="/">
                        <Button size="sm" variant="primary" leftIcon={<ArrowLeft size={14} />}>
                          Customer Home
                        </Button>
                      </Link>
                      <Link to="/provider">
                        <Button size="sm" variant="outline" leftIcon={<Briefcase size={14} />}>
                          Provider Console
                        </Button>
                      </Link>
                    </div>
                  }
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
