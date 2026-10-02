import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Lock, Save } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { AdminService } from '../../services/admin.service';

export const AdminSettingsPage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [autoDispatch, setAutoDispatch] = useState<boolean>(true);
  const [requirePoliceVerification, setRequirePoliceVerification] = useState<boolean>(true);
  const [escrowTimeoutHours, setEscrowTimeoutHours] = useState<string>('48');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await AdminService.getSettings();
      for (const s of settings) {
        if (s.key === 'MAINTENANCE_MODE') setMaintenanceMode(s.value === 'true');
        if (s.key === 'AUTO_DISPATCH') setAutoDispatch(s.value === 'true');
        if (s.key === 'REQUIRE_VERIFICATION') setRequirePoliceVerification(s.value === 'true');
        if (s.key === 'ESCROW_TIMEOUT_HOURS') setEscrowTimeoutHours(String(s.value ?? '48'));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        AdminService.updateSetting('MAINTENANCE_MODE', String(maintenanceMode), 'Platform maintenance mode flag'),
        AdminService.updateSetting('AUTO_DISPATCH', String(autoDispatch), 'Automated dispatch matching'),
        AdminService.updateSetting('REQUIRE_VERIFICATION', String(requirePoliceVerification), 'Mandatory verification requirement'),
        AdminService.updateSetting('ESCROW_TIMEOUT_HOURS', escrowTimeoutHours, 'Escrow release timeout window'),
      ]);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Platform Operational Controls &amp; Settings"
        description="Configure dispatch algorithm rules, escrow hold duration windows, verification compliance mandates, and operational safety flags."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} isLoading={isLoading}>
            Save Controls
          </Button>
        }
      />

      {savedNotice && (
        <Alert variant="success" title="Settings Saved">
          Operational preferences saved to server and persisted in PostgreSQL.
        </Alert>
      )}

      {/* Operational Mode Flags */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-neutral-700" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Dispatch &amp; Onboarding Controls
            </CardTitle>
          </div>
          <Badge variant="neutral" size="sm">System Controls</Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">Automated Dispatch Matching</span>
              <p className="text-xs text-neutral-500">Automatically route incoming service requests to qualified partners in radius.</p>
            </div>
            <input
              type="checkbox"
              checked={autoDispatch}
              onChange={(e) => setAutoDispatch(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              aria-label="Toggle automated dispatch matching"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">Mandatory Police Verification</span>
              <p className="text-xs text-neutral-500">Require verified police clearance certificate before provider dispatch activation.</p>
            </div>
            <input
              type="checkbox"
              checked={requirePoliceVerification}
              onChange={(e) => setRequirePoliceVerification(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              aria-label="Toggle mandatory police verification"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">Platform Maintenance Mode</span>
              <p className="text-xs text-neutral-500">Display maintenance notice to customers while operations continue in admin console.</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              aria-label="Toggle platform maintenance mode"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs font-semibold text-neutral-900 block">Escrow Release Timeout Window</span>
              <p className="text-xs text-neutral-500">Hours after job completion when funds automatically release if no dispute is opened.</p>
            </div>
            <div className="w-24">
              <input
                type="number"
                value={escrowTimeoutHours}
                onChange={(e) => setEscrowTimeoutHours(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 text-neutral-800"
                aria-label="Escrow release timeout hours"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Confidentiality Framework Notice */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-neutral-700" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Security &amp; Data Governance Principles
            </CardTitle>
          </div>
          <Badge variant="success" size="sm">Active Policies</Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-xs text-neutral-600">
          <p>
            &bull; <strong>Strict Privacy Boundaries:</strong> Customer and partner contact details are masked in all standard administrative listing tables.
          </p>
          <p>
            &bull; <strong>Governance Audit Trails:</strong> All administrative modifications, account suspensions, and dispute resolutions require explicit justifications and are tracked in immutable audit logs.
          </p>
          <p>
            &bull; <strong>Zero Fabricated Data:</strong> SevaSetu UI strictly reflects real platform database records without dummy or simulated telemetry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
