import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, Server, Clock, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { HealthStatus } from '@sevasetu/shared';
import { getBackendHealth } from '../services/health.service';
import { apiClient, ApiError } from '../services/apiClient';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Spinner,
  Alert,
} from '../components/ui';
import { PageContainer } from '../layouts/PageContainer';
import { PageHeader } from '../layouts/PageHeader';

export const HealthMonitor: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await getBackendHealth();
      if (response.data) {
        setHealthData(response.data);
      } else {
        setErrorMessage('Received unexpected response format without health data.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred while connecting to the backend.');
      }
      setHealthData(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const apiEndpoint = `${apiClient.getBaseUrl()}/health`;

  return (
    <PageContainer maxWidth="sm">
      {/* Reusable PageHeader */}
      <PageHeader
        title="System Health & Backend Connection"
        description="Live monitoring connection between the React client and the Node.js / Express backend with Prisma & PostgreSQL."
        breadcrumbs={[
          { label: 'Foundation', href: '/' },
          { label: 'System Health' },
        ]}
      />

      <div className="space-y-6 mt-6">

      {/* Target API Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-neutral-200 bg-white text-xs">
        <div className="flex items-center gap-2 text-neutral-600">
          <Server size={14} className="text-neutral-500" />
          <span className="font-semibold text-neutral-700">Target Endpoint:</span>
        </div>
        <code className="font-mono bg-neutral-100 px-2.5 py-1 rounded text-neutral-800 text-[11px] break-all border border-neutral-200">
          {apiEndpoint}
        </code>
      </div>

      {/* Loading state */}
      {loading && (
        <Card padding="lg" className="flex flex-col items-center justify-center py-12 space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-600 font-medium">
            Querying backend health and PostgreSQL database connection...
          </p>
        </Card>
      )}

      {/* Error state */}
      {!loading && errorMessage && (
        <div className="space-y-4">
          <Alert variant="error" title="Backend Connection Failed">
            <p className="font-mono text-xs mt-1 break-all">{errorMessage}</p>
          </Alert>

          <Card padding="md" variant="subtle" className="text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Diagnostic Guidance</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Ensure the backend Express server is running on <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-300">http://localhost:5000</code>.
              Verify PostgreSQL is active on port 5432 and run <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-300">npm run dev:server</code>.
            </p>
          </Card>
        </div>
      )}

      {/* Connected Success state */}
      {!loading && healthData && (
        <Card variant="elevated" padding="md" className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <CardTitle>Core Service Status</CardTitle>
              <CardDescription>Verified live response from GET /api/health</CardDescription>
            </div>
            <Badge
              variant={healthData.status === 'healthy' ? 'success' : 'warning'}
              withDot
              size="md"
            >
              {healthData.status === 'healthy' ? 'System Operational' : 'System Degraded'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Server Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <Server size={14} />
                  <span>Service Name</span>
                </div>
                <div className="font-semibold text-neutral-900 mt-1 text-sm">{healthData.service}</div>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Environment</span>
                </div>
                <div className="font-semibold text-neutral-900 mt-1 text-sm capitalize">
                  {healthData.environment}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Server Uptime</span>
                </div>
                <div className="font-mono font-semibold text-neutral-900 mt-1 text-sm">
                  {healthData.uptimeSeconds}s
                </div>
              </div>

              <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
                <div className="text-neutral-500 flex items-center gap-1.5">
                  <Activity size={14} />
                  <span>Timestamp</span>
                </div>
                <div className="font-mono font-semibold text-neutral-900 mt-1 text-[11px] truncate">
                  {healthData.timestamp}
                </div>
              </div>
            </div>

            {/* Database Status Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-primary-600" />
                  <span className="text-xs font-semibold text-neutral-900">PostgreSQL (Prisma ORM)</span>
                </div>
                <Badge
                  variant={healthData.database.connected ? 'success' : 'warning'}
                  size="sm"
                >
                  {healthData.database.connected ? 'Connected' : 'Unavailable'}
                </Badge>
              </div>
              <p className="text-xs text-neutral-700 font-mono bg-neutral-50 p-2.5 rounded border border-neutral-200 break-words">
                {healthData.database.message}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void fetchStatus()}
              isLoading={loading}
            >
              Refresh Status
            </Button>
            {lastChecked && (
              <span className="text-xs text-neutral-600 font-mono">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </CardFooter>
        </Card>
      )}

      {/* Standby refresh if error */}
      {!loading && errorMessage && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void fetchStatus()}
          >
            Retry Connection
          </Button>
        </div>
      )}
      </div>
    </PageContainer>
  );
};
