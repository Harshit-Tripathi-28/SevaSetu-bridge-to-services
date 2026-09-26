import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { ServiceRequestWizard } from '../../components/customer/request';

export const RequestServicePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialProviderId = searchParams.get('providerId') || undefined;

  return (
    <PageContainer maxWidth="lg" className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Request a Local Service"
        description="Follow the guided steps below to structure your service requirement, select schedule preferences, and review details before dispatch."
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Request Service' },
        ]}
      />

      {/* Multi-Step Guided Service Request Experience */}
      <ServiceRequestWizard
        initialCategory={initialCategory}
        initialProviderId={initialProviderId}
      />

      {/* Trust & Safety Assurance Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-200 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>Identity-verified local specialists</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-primary-600 shrink-0" />
          <span>Transparent upfront estimates</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <span>Punctual arrival commitment</span>
        </div>
      </div>
    </PageContainer>
  );
};
