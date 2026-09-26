import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { ApplicationShell } from './layouts/ApplicationShell';
import { Button } from './components/ui/Button';
import { EmptyState } from './components/ui/EmptyState';
import {
  CustomerHomePage,
  ServiceDiscoveryPage,
  ServiceDetailPage,
  ProviderProfilePage,
  RequestServicePage,
  CustomerActivityPage,
} from './pages/customer';
import { ShellPreview } from './pages/ShellPreview';
import { DesignSystemPreview } from './pages/DesignSystemPreview';
import { HealthMonitor } from './pages/HealthMonitor';
import type { NavItem } from './components/navigation/types';

export const App: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home size={15} /> },
    { label: 'Find Services', href: '/services', icon: <Search size={15} /> },
    { label: 'Request Service', href: '/request', icon: <Sparkles size={15} /> },
    { label: 'Activity', href: '/activity', icon: <CalendarClock size={15} /> },
    { label: 'Health & DB', href: '/health', icon: <Activity size={15} /> },
    { label: 'Design System', href: '/design-system', icon: <Layers size={15} /> },
  ];

  const sidebarItems: NavItem[] = [
    { label: 'Customer Home', href: '/', icon: <Home size={15} /> },
    { label: 'Browse Services', href: '/services', icon: <Search size={15} /> },
    { label: 'Request Service', href: '/request', icon: <Sparkles size={15} /> },
    { label: 'My Activity', href: '/activity', icon: <CalendarClock size={15} /> },
    { label: 'System Health', href: '/health', icon: <Activity size={15} /> },
    { label: 'Design System', href: '/design-system', icon: <Layers size={15} /> },
    { label: 'Shell Layout', href: '/shell-preview', icon: <Layout size={15} /> },
  ];

  return (
    <BrowserRouter>
      <ApplicationShell
        navItems={navItems}
        sidebarItems={sidebarItems}
        showSidebar={showSidebar}
        sidebarTitle="Customer Navigation"
        headerActionArea={
          <div className="flex items-center gap-2">
            <Link to="/request">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />}>
                Request Service
              </Button>
            </Link>
            <Button
              variant={showSidebar ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<PanelLeft size={14} />}
              onClick={() => setShowSidebar((prev) => !prev)}
              aria-label="Toggle sidebar navigation"
              className="hidden lg:inline-flex"
            >
              {showSidebar ? 'Hide Menu' : 'Sidebar'}
            </Button>
          </div>
        }
      >
        <Routes>
          {/* Customer Experience Routes */}
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/services" element={<ServiceDiscoveryPage />} />
          <Route path="/services/:category" element={<ServiceDiscoveryPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/provider/:id" element={<ProviderProfilePage />} />
          <Route path="/request" element={<RequestServicePage />} />
          <Route path="/activity" element={<CustomerActivityPage />} />

          {/* Foundation & Architecture Views */}
          <Route
            path="/shell-preview"
            element={
              <ShellPreview
                showSidebar={showSidebar}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
              />
            }
          />
          <Route path="/design-system" element={<DesignSystemPreview />} />
          <Route path="/health" element={<HealthMonitor />} />

          {/* Accessible 404 Catch-all */}
          <Route
            path="*"
            element={
              <div className="flex-1 flex items-center justify-center p-6">
                <EmptyState
                  title="Page Not Found"
                  description="The requested page does not exist within the customer experience."
                  action={
                    <Link to="/">
                      <Button size="sm" variant="primary" leftIcon={<ArrowLeft size={14} />}>
                        Return to Customer Home
                      </Button>
                    </Link>
                  }
                />
              </div>
            }
          />
        </Routes>
      </ApplicationShell>
    </BrowserRouter>
  );
};
