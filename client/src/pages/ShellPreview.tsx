import React, { useState } from 'react';
import {
  Layers,
  Layout,
  PanelLeft,
  Navigation,
  Smartphone,
  Monitor,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '../layouts/PageContainer';
import { PageHeader } from '../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs';

export interface ShellPreviewProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

export const ShellPreview: React.FC<ShellPreviewProps> = ({
  showSidebar,
  onToggleSidebar,
}) => {
  const [selectedWidth, setSelectedWidth] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  return (
    <PageContainer maxWidth={selectedWidth}>
      {/* Reusable PageHeader with Breadcrumbs & Actions */}
      <PageHeader
        title="Application Shell & Global Navigation"
        description="Standardized structural layouts, responsive desktop and mobile navigation, page container constraints, and sidebar frameworks."
        breadcrumbs={[
          { label: 'Foundation', href: '/' },
          { label: 'Application Shell' },
        ]}
        actions={
          <Button
            variant={showSidebar ? 'primary' : 'outline'}
            size="sm"
            leftIcon={<PanelLeft size={16} />}
            onClick={onToggleSidebar}
          >
            {showSidebar ? 'Sidebar Enabled (Click to Hide)' : 'Enable Sidebar Framework'}
          </Button>
        }
      />

      {/* Main Structural Showcase Content */}
      <div className="space-y-8 mt-8">
        {/* Architecture Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-neutral-900">Shell Architecture Verified</span>
                <Badge variant="success" size="sm" withDot>Active</Badge>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                Global Header, Mobile Drawer, Desktop Nav, Page Containers, and Footer are active and verified.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-neutral-600">Container Width:</span>
            {(['sm', 'md', 'lg', 'xl'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWidth(w)}
                className={`px-2.5 py-1 text-xs font-mono uppercase rounded border transition-colors cursor-pointer ${
                  selectedWidth === w
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary-600 mb-1">
                <Layout size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Layout Structure</span>
              </div>
              <CardTitle>Page Container &amp; Header</CardTitle>
              <CardDescription>Predictable grid &amp; responsive padding</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Configurable maximum widths (sm, md, lg, xl, full)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Responsive horizontal padding (16px to 32px)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Integrated Breadcrumbs and Action slots</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <span className="text-[11px] text-neutral-600 font-mono">layouts/PageContainer.tsx</span>
            </CardFooter>
          </Card>

          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary-600 mb-1">
                <Navigation size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Navigation Systems</span>
              </div>
              <CardTitle>Desktop &amp; Mobile Nav</CardTitle>
              <CardDescription>Dual-mode responsive navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Desktop inline menu with visible active indicator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Mobile off-canvas drawer with smooth transition</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Focus management &amp; Escape key support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <span className="text-[11px] text-neutral-600 font-mono">components/navigation/</span>
            </CardFooter>
          </Card>

          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary-600 mb-1">
                <PanelLeft size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Sidebar Pillar</span>
              </div>
              <CardTitle>Sidebar Framework</CardTitle>
              <CardDescription>Collapsible auxiliary navigation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Expanded state (256px) and collapsed state (64px)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Responsive mobile drawer transformation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Toggleable via top action or keyboard</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <span className="text-[11px] text-neutral-600 font-mono">layouts/Sidebar.tsx</span>
            </CardFooter>
          </Card>
        </div>

        {/* Breadcrumb Variations Demo */}
        <Card padding="md" className="space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-semibold text-neutral-900">Breadcrumb Hierarchy Demonstrations</h3>
            <p className="text-xs text-neutral-600">Accessible semantic navigation for deep page nesting.</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-[11px] font-mono text-neutral-600 block mb-1.5">2-Level Path:</span>
              <Breadcrumbs
                items={[
                  { label: 'Foundation', href: '/' },
                  { label: 'Application Shell' },
                ]}
              />
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-[11px] font-mono text-neutral-600 block mb-1.5">3-Level Deep Path:</span>
              <Breadcrumbs
                items={[
                  { label: 'Platform Architecture', href: '/' },
                  { label: 'User Interface', href: '/design-system' },
                  { label: 'Navigation Guidelines' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Responsive Guidelines Verification Grid */}
        <Card padding="md" className="space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-base font-semibold text-neutral-900">Responsive Breakpoints &amp; Behaviors</h3>
            <p className="text-xs text-neutral-600">Deterministic layout adaptations without content clipping or horizontal overflow.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Smartphone size={14} className="text-primary-600" />
                <span>Mobile (&lt;768px)</span>
              </div>
              <p className="text-neutral-600">
                Header collapses navigation into accessible off-canvas drawer. Sidebar becomes mobile drawer. Page padding scales to 16px.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Layers size={14} className="text-primary-600" />
                <span>Tablet (768px - 1023px)</span>
              </div>
              <p className="text-neutral-600">
                Desktop horizontal navigation activates. Page padding increases to 24px. Sidebar docks cleanly with collapsible toggle.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-neutral-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Monitor size={14} className="text-primary-600" />
                <span>Desktop (&ge;1024px)</span>
              </div>
              <p className="text-neutral-600">
                Full-width layout with controlled max-width constraints (up to 1280px / 7xl). Zero horizontal scrollbars.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
