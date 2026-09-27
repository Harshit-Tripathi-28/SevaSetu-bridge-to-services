import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import type { AdminActionDialogConfig } from '../../types/admin';

export interface AdminActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AdminActionDialogConfig | null;
  onConfirm?: (reason: string) => void;
}

export const AdminActionDialog: React.FC<AdminActionDialogProps> = ({
  isOpen,
  onClose,
  config,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!config) return null;

  const handleClose = () => {
    setReason('');
    setSubmitted(false);
    onClose();
  };

  const handleConfirm = () => {
    if (config.requireReason && !reason.trim()) {
      return;
    }
    setSubmitted(true);
    if (onConfirm) {
      onConfirm(reason);
    }
  };

  const getIcon = () => {
    if (config.severity === 'destructive') {
      return <AlertTriangle className="text-error-600 shrink-0" size={24} />;
    }
    if (config.severity === 'warning') {
      return <ShieldAlert className="text-warning-600 shrink-0" size={24} />;
    }
    return <Info className="text-primary-600 shrink-0" size={24} />;
  };

  const isConfirmDisabled = config.requireReason && !reason.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={config.title}
      size="md"
    >
      <div className="space-y-4">
        {/* Affected Entity Banner */}
        <div className="p-3 bg-neutral-100 rounded-lg text-sm border border-neutral-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Target Entity
          </div>
          <div className="font-semibold text-neutral-900 mt-0.5">
            {config.entityName}
          </div>
          <div className="text-xs text-neutral-500 font-mono mt-0.5">
            Ref: {config.entityId}
          </div>
        </div>

        {/* Consequence Notice */}
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
          {getIcon()}
          <div className="text-sm text-neutral-700">
            <span className="font-semibold text-neutral-900 block mb-0.5">Operational Impact</span>
            {config.consequenceNotice}
          </div>
        </div>

        {/* Reason Field */}
        <div>
          <label htmlFor="admin-action-reason" className="block text-xs font-medium text-neutral-700 mb-1.5">
            Action Justification / Audit Reason {config.requireReason && <span className="text-error-500">*</span>}
          </label>
          <Textarea
            id="admin-action-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={config.reasonPlaceholder || 'Enter operational reason for audit logging...'}
            disabled={submitted}
            aria-required={config.requireReason}
          />
          {config.requireReason && !reason.trim() && (
            <p className="text-[11px] text-neutral-500 mt-1">
              An explicit reason is mandatory for high-impact governance actions.
            </p>
          )}
        </div>

        {/* Backend Authority Notice */}
        <Alert variant="info" title="Operational Control Notice">
          This governance action operates within the Part 7 UI framework. Execution requires live backend authorization endpoints and audit logging before persistent mutation occurs.
        </Alert>

        {submitted && (
          <Alert variant="success" title="Action Recorded in UI">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>Administrative action acknowledged in local state session.</span>
            </div>
          </Alert>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={submitted}>
            Cancel
          </Button>
          <Button
            variant={config.severity === 'destructive' ? 'destructive' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirmDisabled || submitted}
          >
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
