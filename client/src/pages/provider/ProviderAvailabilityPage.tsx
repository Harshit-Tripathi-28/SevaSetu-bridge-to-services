import React from 'react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { AvailabilityEditor } from '../../components/provider/AvailabilityEditor';

export const ProviderAvailabilityPage: React.FC = () => {
  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title="Availability &amp; Operating Hours"
        description="Configure your recurring weekly work hours, lunch breaks, and holiday date overrides to manage incoming customer booking dispatches."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Availability' },
        ]}
      />

      {/* Reusable Availability Editor Component */}
      <AvailabilityEditor />
    </PageContainer>
  );
};
