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
  ShieldCheck,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { JobStatusBadge } from '../../components/provider/ProviderStatusBadge';
import { JobTimeline } from '../../components/provider/JobTimeline';
import { JobCompletionForm } from '../../components/provider/JobCompletionForm';
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
          <Link to="/provider/jobs">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Back to Jobs
            </Button>
          </Link>
        }
      />

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Details & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="info" size="sm">{sampleJob.category}</Badge>
                <JobStatusBadge status={sampleJob.status} />
              </div>
              <CardTitle className="text-lg pt-1">{sampleJob.serviceTitle}</CardTitle>
              <CardDescription>Associated with Service Request #{sampleJob.requestId}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-xs text-neutral-700">
              {/* Timeline Stepper */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Service Execution Stage
                </span>
                <JobTimeline currentStatus={sampleJob.status} />
              </div>

              {/* Schedule and Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-neutral-200/80">
                <div className="space-y-1">
                  <span className="text-neutral-500 text-[11px] block">Scheduled Appointment</span>
                  <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                    <Calendar size={14} className="text-neutral-400" />
                    <span>{sampleJob.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 font-mono">
                    <Clock size={14} className="text-neutral-400" />
                    <span>{sampleJob.scheduledTime}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-neutral-500 text-[11px] block">Client Contact</span>
                  <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                    <User size={14} className="text-neutral-400" />
                    <span>{sampleJob.customerNameMasked}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary-700">
                    <Phone size={13} className="text-primary-600" />
                    <span className="font-mono">+91 98••••••45</span>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-neutral-100 flex items-start gap-2">
                  <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                  <p className="font-medium text-neutral-900 leading-snug">
                    {sampleJob.location}
                  </p>
                </div>
              </div>

              {/* Recorded Completion Notes if Complete */}
              {completionNotes && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <span className="font-semibold text-emerald-900 text-xs block flex items-center gap-1.5">
                    <CheckCheck size={15} className="text-emerald-700" />
                    <span>Work Handover Notes</span>
                  </span>
                  <p className="text-neutral-800 text-xs leading-relaxed">
                    {completionNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Completion Form Modal/Drawer Area */}
          {showCompletionForm && (
            <JobCompletionForm
              jobId={sampleJob.id}
              serviceTitle={sampleJob.serviceTitle}
              onComplete={handleCompleteSuccess}
              onCancel={() => setShowCompletionForm(false)}
            />
          )}

          {/* Trust & Safety Guidance */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-neutral-800">On-Site Security Protocol</p>
              <p className="leading-relaxed">
                Ensure safety gear (insulated tools, safety footwear) is utilized during execution. Client satisfaction confirmation is sent automatically via SMS/push when you complete the job.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Status Transition Actions */}
        <div className="lg:col-span-4 space-y-6">
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
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <CheckCheck size={24} className="text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-xs text-emerald-950">Job Successfully Completed</h4>
                  <p className="text-[11px] text-emerald-800">
                    Handover recorded. Final payment settlement scheduled in earnings balance.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Service Fee:</span>
              <span className="font-bold text-neutral-900 text-sm">₹{sampleJob.price}</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
