import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Users,
  Briefcase,
  CalendarClock,
  CheckCircle,
  AlertTriangle,
  LifeBuoy,
  Database,
  ArrowRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { getBackendHealth } from '../../services/health.service';
import { AdminService } from '../../services/admin.service';
import type { HealthStatus, AdminDashboardMetrics } from '@sevasetu/shared';

export const AdminOverviewPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);

  const fetchHealthAndMetrics = async () => {
    setHealthLoading(true);
    setMetricsLoading(true);
    setHealthError(null);
    try {
      const [healthRes, metricsData] = await Promise.all([
        getBackendHealth().catch(() => null),
        AdminService.getDashboardMetrics().catch(() => null),
      ]);
      if (healthRes && healthRes.data) {
        setHealth(healthRes.data);
      }
      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (err: unknown) {
      setHealthError(err instanceof Error ? err.message : 'Unable to connect to platform API gateway');
    } finally {
      setHealthLoading(false);
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndMetrics();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title="Operations &amp; Governance Overview"
        description="Unified platform operations dashboard for user management, verification pipelines, dispute handling, and system telemetry."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={healthLoading || metricsLoading ? 'animate-spin' : ''} />}
              onClick={fetchHealthAndMetrics}
              disabled={healthLoading || metricsLoading}
            >
              Refresh Telemetry
            </Button>
            <Link to="/admin/trust-safety">
              <Button variant="primary" size="sm" leftIcon={<ShieldCheck size={14} />}>
                Trust &amp; Safety Hub
              </Button>
            </Link>
          </div>
        }
      />

      {/* Platform Real-Time Health Card */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-50 text-primary-700">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Platform Core Telemetry</h2>
              <p className="text-xs text-neutral-500">Live backend service and database health validation</p>
            </div>
          </div>
          <div>
            {healthLoading ? (
              <Badge variant="neutral" size="sm">
                <Spinner size="sm" className="mr-1.5" /> Checking Gateway...
              </Badge>
            ) : healthError ? (
              <Badge variant="error" size="sm">Gateway Offline</Badge>
            ) : health?.status === 'healthy' ? (
              <Badge variant="success" size="sm">All Systems Operational</Badge>
            ) : (
              <Badge variant="warning" size="sm">Degraded Service</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">Platform Status</span>
            <div className="text-sm font-semibold text-neutral-900 mt-1 capitalize">
              {health?.status || 'Unknown'}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-medium">Database Layer</span>
              <Database size={14} className="text-neutral-400" />
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="capitalize">{health?.database?.status || 'Unavailable'}</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-medium">Service Uptime</span>
              <Clock size={14} className="text-neutral-400" />
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-1">
              {health?.uptimeSeconds ? `${Math.floor(health.uptimeSeconds)} seconds` : 'Unavailable'}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">Environment Mode</span>
            <div className="text-sm font-semibold text-neutral-900 mt-1 uppercase text-xs font-mono">
              {health?.environment || 'Development'}
            </div>
          </div>
        </div>

        {healthError && (
          <div className="mt-4">
            <Alert variant="error" title="Backend Health Check Failed">
              {healthError}. Ensure the Express API daemon is running at http://localhost:5000.
            </Alert>
          </div>
        )}
      </Card>

      {/* Operational Queues & Review Pipeline Cards */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
          Governance &amp; Review Queues
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Verification Queue */}
          <Card variant="default" padding="md" className="bg-white hover:border-neutral-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <CheckCircle size={20} />
              </div>
              <Badge variant={metrics && metrics.pendingVerifications > 0 ? 'warning' : 'neutral'} size="sm">
                {metrics ? `${metrics.pendingVerifications} in queue` : '0 in queue'}
              </Badge>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-neutral-900">Provider Verification</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Identity documents, trade certifications, and police clearances awaiting review.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                {metrics && metrics.pendingVerifications > 0 ? `${metrics.pendingVerifications} awaiting action` : 'Queue clean'}
              </span>
              <Link
                to="/admin/verification"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <span>Open Queue</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* Dispute & Reports Queue */}
          <Card variant="default" padding="md" className="bg-white hover:border-neutral-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-red-50 text-red-700">
                <AlertTriangle size={20} />
              </div>
              <Badge variant={metrics && (metrics.openDisputes + metrics.openReports) > 0 ? 'error' : 'neutral'} size="sm">
                {metrics ? `${metrics.openDisputes + metrics.openReports} open cases` : '0 open cases'}
              </Badge>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-neutral-900">Disputes &amp; Reports</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Booking discrepancies, payment disputes, property claims, and safety incident flags.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                {metrics && (metrics.openDisputes + metrics.openReports) > 0 ? `${metrics.openDisputes} disputes, ${metrics.openReports} reports` : 'No active escalations'}
              </span>
              <Link
                to="/admin/reports"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <span>View Cases</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* Support Desk Queue */}
          <Card variant="default" padding="md" className="bg-white hover:border-neutral-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <LifeBuoy size={20} />
              </div>
              <Badge variant={metrics && metrics.openSupportTickets > 0 ? 'info' : 'neutral'} size="sm">
                {metrics ? `${metrics.openSupportTickets} pending` : '0 pending'}
              </Badge>
            </div>
            <div className="mt-3">
              <h4 className="text-sm font-bold text-neutral-900">Support Operations</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Inquiries, platform feedback, and service assistance tickets from users and providers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                {metrics && metrics.openSupportTickets > 0 ? `${metrics.openSupportTickets} tickets in queue` : 'All tickets cleared'}
              </span>
              <Link
                to="/admin/support"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <span>Support Center</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Domain Operations Grid */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
          Platform Directory &amp; Dispatch
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/users" className="block group">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 group-hover:border-neutral-300 transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">User Management</h4>
                    <p className="text-xs text-neutral-500">Customer and operator directory</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-neutral-400 group-hover:text-neutral-800 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          <Link to="/admin/providers" className="block group">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 group-hover:border-neutral-300 transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Provider Network</h4>
                    <p className="text-xs text-neutral-500">Service partners &amp; compliance</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-neutral-400 group-hover:text-neutral-800 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>

          <Link to="/admin/bookings" className="block group">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 group-hover:border-neutral-300 transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Booking Dispatch</h4>
                    <p className="text-xs text-neutral-500">Requests, appointments &amp; state</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-neutral-400 group-hover:text-neutral-800 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Honest Empty State for Recent Operational Activity */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-sm font-bold text-neutral-900">Recent Operational Activity</CardTitle>
          <p className="text-xs text-neutral-500">Chronological activity events across verification, safety, and dispatch</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-8 text-center">
            <p className="text-xs font-medium text-neutral-500">
              No recent administrative actions or system events recorded yet.
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Events will automatically populate here as operations are performed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
