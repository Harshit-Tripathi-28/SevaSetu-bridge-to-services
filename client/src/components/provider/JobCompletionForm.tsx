import React, { useState } from 'react';
import {
  CheckCheck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export interface JobCompletionFormProps {
  jobId: string;
  serviceTitle: string;
  onComplete: (notes: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const JobCompletionForm: React.FC<JobCompletionFormProps> = ({
  jobId,
  serviceTitle,
  onComplete,
  onCancel,
  className,
}) => {
  const [workNotes, setWorkNotes] = useState('');
  const [confirmedSafety, setConfirmedSafety] = useState(false);
  const [customerInspected, setCustomerInspected] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workNotes.trim() || workNotes.trim().length < 10) {
      setError('Please provide work notes detailing what repairs or service was executed (min 10 characters).');
      return;
    }
    if (!confirmedSafety || !customerInspected) {
      setError('You must confirm both safety testing and client handover checklist items.');
      return;
    }

    setError('');
    setSubmitted(true);
    onComplete(workNotes);
  };

  return (
    <Card variant="default" padding="md" className={`bg-white space-y-6 ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
          <CheckCheck size={16} />
          <span>Execution Handover</span>
        </div>
        <CardTitle className="text-lg pt-1">Record Job Completion — {serviceTitle}</CardTitle>
        <CardDescription>
          Document on-site work performed and complete the handover checklist for Job #{jobId}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {submitted && (
          <Alert variant="success" title="Completion Recorded">
            Job completion has been logged for this session. Client receipt and settlement review are being generated.
          </Alert>
        )}

        {/* Work Description Notes */}
        <Textarea
          label="Execution Notes &amp; Work Performed"
          rows={3}
          placeholder="e.g. Dismantled faulty switchboard, replaced 16A modular socket, tested live load with multimeter, verified earthing..."
          value={workNotes}
          onChange={(e) => {
            setWorkNotes(e.target.value);
            if (error) setError('');
          }}
          error={error ? error : undefined}
          required
          helperText="Detailed technical notes will be appended to the job record and visible in customer activity."
        />

        {/* Mandatory Quality & Handover Checklist */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
          <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Mandatory Handover Checklist
          </h4>

          <div className="space-y-2.5">
            <Checkbox
              label="Operational testing &amp; electrical/plumbing safety check completed on site"
              checked={confirmedSafety}
              onChange={(e) => setConfirmedSafety(e.target.checked)}
              required
            />
            <Checkbox
              label="Work inspected and acknowledged by the customer or premises representative"
              checked={customerInspected}
              onChange={(e) => setCustomerInspected(e.target.checked)}
              required
            />
          </div>
        </div>

        {/* Honest Notice */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Marking a job completed informs SevaSetu operations that physical work has concluded. Client feedback and final earnings credit will reflect on your dashboard upon automated audit.
          </p>
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle size={14} />
            <span>{error}</span>
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between">
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Return to Job
          </Button>
        ) : (
          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
            <HelpCircle size={12} />
            <span>Ensure all debris has been cleared before submitting</span>
          </span>
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<CheckCheck size={16} />}
          onClick={handleSubmit}
        >
          Confirm &amp; Complete Job
        </Button>
      </CardFooter>
    </Card>
  );
};
