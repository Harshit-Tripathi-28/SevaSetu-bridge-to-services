import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  ShieldAlert,
  CalendarClock,
  CreditCard,
  AlertTriangle,
  History,
  LifeBuoy,
  Lock,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AccountStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { AdminAccountStatus, AdminActionDialogConfig } from '../../types/admin';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadUser = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await AdminService.getUserDetail(id);
      setUserData(data);
    } catch (err) {
      console.error('Failed to load user details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const status: AdminAccountStatus = (userData?.status?.toLowerCase() as AdminAccountStatus) || 'active';

  const handleTriggerAction = (type: 'suspend' | 'restrict' | 'reactivate') => {
    if (type === 'suspend') {
      setActionConfig({
        actionType: 'suspend_user',
        title: 'Confirm User Account Suspension',
        entityName: userData?.fullName || `User #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Suspending this user will revoke active login sessions, cancel open dispatch bookings, and block new requests.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Specify legal or terms violation reason...',
        confirmLabel: 'Suspend Account',
      });
    } else if (type === 'restrict') {
      setActionConfig({
        actionType: 'restrict_user',
        title: 'Restrict Account Permissions',
        entityName: userData?.fullName || `User #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Restricting this account will prevent creating new service requests while review is ongoing.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for restriction...',
        confirmLabel: 'Apply Restriction',
      });
    } else {
      setActionConfig({
        actionType: 'reactivate_user',
        title: 'Reactivate Account',
        entityName: userData?.fullName || `User #${id}`,
        entityId: id || 'N/A',
        consequenceNotice: 'This will restore standard user permissions across the platform.',
        severity: 'primary',
        requireReason: true,
        reasonPlaceholder: 'Note authorization for account restoration...',
        confirmLabel: 'Reactivate Account',
      });
    }
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!actionConfig || !id) return;
    try {
      if (actionConfig.actionType === 'suspend_user') {
        await AdminService.updateUserStatus(id, 'SUSPENDED', reason);
      } else if (actionConfig.actionType === 'restrict_user') {
        await AdminService.updateUserStatus(id, 'INACTIVE', reason);
      } else if (actionConfig.actionType === 'reactivate_user') {
        await AdminService.updateUserStatus(id, 'ACTIVE', reason);
      }
      setActionConfig(null);
      await loadUser();
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const emailMasked = userData?.email ? `${userData.email.slice(0, 2)}***@***` : 'N/A';
  const phoneMasked = userData?.phone ? `${userData.phone.slice(0, 3)}****${userData.phone.slice(-3)}` : 'N/A';

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading user profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title={`User Operations Profile`}
        description="Comprehensive administrative summary, contact privacy masking, dispatch history, and governance audit trail."
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Users', href: '/admin/users' },
          { label: id ? `User ${id}` : 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Users
              </Button>
            </Link>
            {status === 'active' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShieldAlert size={14} />}
                  onClick={() => handleTriggerAction('restrict')}
                >
                  Restrict
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleTriggerAction('suspend')}
                >
                  Suspend User
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTriggerAction('reactivate')}
              >
                Reactivate Account
              </Button>
            )}
          </div>
        }
      />

      {/* Top Profile Summary Card */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 font-bold text-lg">
              <User size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-neutral-900">{userData?.fullName || 'Platform User Reference'}</h2>
                <AccountStatusBadge status={status} />
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">UID: {id || 'USR-PENDING'}</p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Registered on {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        {/* Contact with Privacy Masking */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Mail size={13} />
              <span>Masked Email</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {emailMasked}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Phone size={13} />
              <span>Masked Telephone</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {phoneMasked}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <MapPin size={13} />
              <span>Location Region</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              {userData?.addresses?.[0]?.city || 'Active Dispatch Zone'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Lock size={13} className="text-neutral-400" />
            <span>PII is protected by administrative privacy protocols</span>
          </span>
          <Badge variant="neutral" size="sm">{userData?.role || 'Standard Role'}</Badge>
        </div>
      </Card>

      {/* Grid of Sections: Service History, Payment/Disputes, Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking & Service Activity Structure */}
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-primary-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Service Booking History
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">{userData?._count?.customerBookings || 0} bookings</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              {userData?._count?.customerBookings ? `${userData._count.customerBookings} bookings recorded for this customer.` : 'No booking records associated with this account.'}
            </div>
          </CardContent>
        </Card>

        {/* Payments & Transactions Summary */}
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Transaction References
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">Escrow Protected</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              Transactions are settled through server-authoritative payment workflows.
            </div>
          </CardContent>
        </Card>

        {/* Reports & Safety Incidents */}
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Trust &amp; Safety Cases
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">{userData?._count?.reportsReceived || 0} reports</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              {userData?._count?.reportsReceived ? `${userData._count.reportsReceived} reports filed involving this account.` : 'No active or historical dispute cases associated with this user.'}
            </div>
          </CardContent>
        </Card>

        {/* Support History */}
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy size={16} className="text-blue-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Support History
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">{userData?._count?.supportTickets || 0} tickets</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              {userData?._count?.supportTickets ? `${userData._count.supportTickets} support tickets registered.` : 'No support inquiries submitted by this user.'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit & Activity Timeline Structure */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neutral-600" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Operational Audit Timeline
            </CardTitle>
          </div>
          <span className="text-xs text-neutral-400">Read-oriented log</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-8 text-center text-xs text-neutral-500">
            Administrative mutations and audit events are recorded in PostgreSQL audit logs.
          </div>
        </CardContent>
      </Card>

      {/* High-Impact Governance Action Modal */}
      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
