import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Truck,
  PlayCircle,
  CheckCheck,
  Phone,
  MessageSquare,
  Receipt,
  Wallet,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { JobStatusBadge } from '../../components/provider/ProviderStatusBadge';
import { JobTimeline } from '../../components/provider/JobTimeline';
import { JobCompletionForm } from '../../components/provider/JobCompletionForm';
import { PaymentStatusBadge } from '../../components/transaction/PaymentStatusBadge';
import type { ProviderJobItem, ProviderJobStatus } from '../../types';

export const ProviderJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = id || 'JOB-ACTIVE';

  const [jobStatus, setJobStatus] = useState<ProviderJobStatus>('scheduled');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState<string | null>(null);

  const sampleJob: ProviderJobItem = {
    id: jobId,
    requestId: 'REQ-20260926-7848',
    serviceTitle: 'Ceiling Fan Installation & Wiring Check',
    category: 'Electrical',
    customerNameMasked: 'Aditya S. (Verified Client)',
    location: 'Flat 402, Block B, Green Heights, Sector 62, Noida (201301)',
    scheduledDate: '2026-09-28',
    scheduledTime: '10:00 AM – 12:00 PM',
    duration: '1–2 Hours',
    status: jobStatus,
    price: 450,
    timeline: [
      { status: 'scheduled', label: 'Appointment Scheduled', timestamp: '2026-09-26 10:30 AM' },
    ],
    workNotes: completionNotes || undefined,
  };

  const handleAdvanceStatus = (nextStatus: ProviderJobStatus) => {
    if (nextStatus === 'completed') {
      setShowCompletionForm(true);
    } else {
      setJobStatus(nextStatus);
    }
  };

  const handleCompleteSuccess = (notes: string) => {
    setCompletionNotes(notes);
    setJobStatus('completed');
    setShowCompletionForm(false);
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title={`Manage Job #${jobId}`}
        description="Active job dispatch, live status step transition, client contact protocol, and completion handover."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Jobs', href: '/provider/jobs' },
          { label: `#${jobId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/provider/messages">
              <Button variant="outline" size="sm" leftIcon={<MessageSquare size={14} />}>
                Message Client
              </Button>
            </Link>
            <Link to="/provider/jobs">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Jobs
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Details & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">{sampleJob.category}</Badge>
                  <PaymentStatusBadge
                    status={jobStatus === 'completed' ? 'paid' : 'authorized'}
                    size="sm"
                  />
                </div>
                <JobStatusBadge status={sampleJob.status} />
              </div>
              <CardTitle className="text-lg pt-1">{sampleJob.serviceTitle}</CardTitle>
              <CardDescription>Associated with Service Request #{sampleJob.requestId}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-xs text-neutral-700">
              {/* Timeline Stepper */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-semibold text-neutral-900 block pb-1">Dispatch &amp; Job Status</span>
                <JobTimeline currentStatus={jobStatus} />
              </div>

              {/* Client & Location Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-100">
                    <User size={13} className="text-neutral-500" />
                    <span>Client Details</span>
                  </div>
                  <p className="font-medium text-neutral-900">{sampleJob.customerNameMasked}</p>
                  <p className="text-neutral-500 flex items-center gap-1 font-mono">
                    <Phone size={11} /> +91 98*** **321 (Masked Relay)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-100">
                    <Calendar size={13} className="text-neutral-500" />
                    <span>Appointment Schedule</span>
                  </div>
                  <p className="font-medium text-neutral-900">{sampleJob.scheduledDate}</p>
                  <p className="text-neutral-500 flex items-center gap-1">
                    <Clock size={11} /> {sampleJob.scheduledTime} ({sampleJob.duration})
                  </p>
                </div>
              </div>

              {/* Service Address */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-white flex items-start gap-2.5">
                <MapPin size={16} className="text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block">Service Location:</span>
                  <span className="text-neutral-600 leading-relaxed">{sampleJob.location}</span>
                </div>
              </div>

              {/* Work Notes upon completion */}
              {sampleJob.workNotes && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="font-semibold text-neutral-900 block">Handover Inspection Notes:</span>
                  <p className="text-neutral-600 italic leading-relaxed">{sampleJob.workNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Completion Form Modal */}
          {showCompletionForm && (
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-white shadow-lg space-y-3">
              <JobCompletionForm
                jobId={sampleJob.id}
                serviceTitle={sampleJob.serviceTitle}
                onComplete={handleCompleteSuccess}
                onCancel={() => setShowCompletionForm(false)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Execution Controls & Earnings Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-base">Job Progression Controls</CardTitle>
              <CardDescription>
                Update your active on-site status as you execute the service.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {jobStatus === 'scheduled' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<Truck size={16} />}
                  onClick={() => handleAdvanceStatus('on_the_way')}
                >
                  Start Trip: On the Way
                </Button>
              )}

              {jobStatus === 'on_the_way' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<MapPin size={16} />}
                  onClick={() => handleAdvanceStatus('arrived')}
                >
                  Confirm Arrival on Site
                </Button>
              )}

              {jobStatus === 'arrived' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<PlayCircle size={16} />}
                  onClick={() => handleAdvanceStatus('in_progress')}
                >
                  Begin Work (In Progress)
                </Button>
              )}

              {jobStatus === 'in_progress' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<CheckCheck size={16} />}
                  onClick={() => handleAdvanceStatus('completed')}
                >
                  Complete Service
                </Button>
              )}

              {jobStatus === 'completed' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCheck size={24} className="text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-xs text-emerald-950">Job Successfully Completed</h4>
                  <p className="text-[11px] text-emerald-800">
                    Handover recorded. Final payment settlement scheduled in earnings balance.
                  </p>
                  <Link to={`/invoice/INV-${jobId}`} className="block pt-1">
                    <Button variant="outline" size="sm" leftIcon={<Receipt size={13} />} className="w-full text-xs">
                      View Official Job Invoice
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>

            {/* Payout & Financial Transparency Card */}
            <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="flex items-center gap-1">
                  <Wallet size={12} />
                  <span>Gross Job Value:</span>
                </span>
                <span className="font-mono text-neutral-900 font-medium">₹{sampleJob.price}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Platform Commission (10%):</span>
                <span className="font-mono text-neutral-700">-₹{(sampleJob.price! * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                <span>Net Payout to Bank:</span>
                <span className="font-mono text-sm text-emerald-700">₹{(sampleJob.price! * 0.9).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Quick Chat Link */}
          <Link to="/provider/messages" className="block">
            <Button variant="outline" size="md" className="w-full text-xs" leftIcon={<MessageSquare size={14} />}>
              Open Coordination Chat
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
