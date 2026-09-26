import React, { useState } from 'react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { ProviderServices } from '../../components/provider/ProviderServices';
import type { ProviderServiceItem } from '../../types';

export const ProviderServicesPage: React.FC = () => {
  // Configured provider services state (allows adding, updating, and removing services)
  const [services, setServices] = useState<ProviderServiceItem[]>([
    {
      id: 'svc-1',
      category: 'electrician',
      title: 'Ceiling Fan Installation & Repair',
      description: 'Standard mounting, hook verification, balancing, regulator connection, and safety testing.',
      pricingModel: 'fixed',
      basePrice: 299,
      minDuration: '1–2 hours',
      serviceArea: 'Sector 62 & within 10 km',
      isActive: true,
    },
    {
      id: 'svc-2',
      category: 'electrician',
      title: 'Switchboard & Circuit Diagnostics',
      description: 'Full voltage inspection, loose wire repair, modular switch replacement, and MCB trip diagnosis.',
      pricingModel: 'per_visit',
      basePrice: 199,
      minDuration: '1 hour',
      serviceArea: 'Noida Central & East',
      isActive: true,
    },
  ]);

  const handleAdd = (newSvc: ProviderServiceItem) => {
    setServices((prev) => [newSvc, ...prev]);
  };

  const handleUpdate = (updatedSvc: ProviderServiceItem) => {
    setServices((prev) =>
      prev.map((s) => (s.id === updatedSvc.id ? updatedSvc : s))
    );
  };

  const handleDelete = (svcId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== svcId));
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Services &amp; Pricing Catalog"
        description="Configure your trade packages, pricing models (hourly, fixed, per-visit, per-task, quote), durations, and active statuses."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Services' },
        ]}
      />

      <ProviderServices
        services={services}
        onAddService={handleAdd}
        onUpdateService={handleUpdate}
        onDeleteService={handleDelete}
      />
    </PageContainer>
  );
};
