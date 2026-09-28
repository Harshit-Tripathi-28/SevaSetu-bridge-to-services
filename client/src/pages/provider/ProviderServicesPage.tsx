import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { ProviderServices } from '../../components/provider/ProviderServices';
import { Alert } from '../../components/ui/Alert';
import { providerService } from '../../services/provider.service';
import { catalogService } from '../../services/catalog.service';
import type { ProviderServiceItem, ProviderPricingModel } from '../../types';
import type { ProviderServiceRecord, Service as CatalogService, CatalogPricingModel } from '@sevasetu/shared';

const toProviderPricingModel = (model?: string | null): ProviderPricingModel => {
  const m = (model || 'fixed').toLowerCase();
  if (m === 'hourly' || m === 'fixed' || m === 'per_visit' || m === 'per_task' || m === 'quote') {
    return m;
  }
  return 'fixed';
};

const toCatalogPricingModel = (model: ProviderPricingModel): CatalogPricingModel => {
  const m = model.toUpperCase();
  if (m === 'HOURLY' || m === 'FIXED' || m === 'PER_VISIT' || m === 'PER_TASK' || m === 'QUOTE') {
    return m;
  }
  return 'FIXED';
};

export const ProviderServicesPage: React.FC = () => {
  const [services, setServices] = useState<ProviderServiceItem[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const [recList, catList] = await Promise.all([
        providerService.getServices(),
        catalogService.getServices(),
      ]);

      setCatalogServices(catList);
      setServices(
        recList.map((rec: ProviderServiceRecord) => {
          const serviceTitle = rec.service?.name || rec.service?.title || rec.customTitle || 'Service Offering';
          const serviceDesc = rec.customDescription || rec.description || rec.service?.description || '';
          const pModel = toProviderPricingModel(rec.pricingModel || rec.service?.pricingModel);
          const price = rec.customPrice ?? rec.basePrice ?? undefined;
          return {
            id: rec.id,
            category: rec.service?.category?.slug || 'general',
            title: serviceTitle,
            description: serviceDesc,
            pricingModel: pModel,
            basePrice: price ? Number(price) : undefined,
            minDuration: rec.minDuration || '1–2 hours',
            serviceArea: 'Assigned service territory',
            isActive: rec.isActive,
          };
        })
      );
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load services',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  const handleAdd = async (newSvc: ProviderServiceItem) => {
    try {
      setFeedback(null);
      // Match with an approved catalog service by category or name
      const matched =
        catalogServices.find(
          (cs) =>
            (cs.name && cs.name.toLowerCase() === newSvc.title.toLowerCase()) ||
            (cs.title && cs.title.toLowerCase() === newSvc.title.toLowerCase()) ||
            cs.category?.slug === newSvc.category
        ) || catalogServices[0];

      if (!matched) {
        throw new Error('No approved platform catalog service available for this selection.');
      }

      const created = await providerService.addService({
        serviceId: matched.id,
        customDescription: newSvc.description,
        description: newSvc.description,
        basePrice: newSvc.basePrice,
        customPrice: newSvc.basePrice,
        pricingModel: toCatalogPricingModel(newSvc.pricingModel),
        isActive: newSvc.isActive,
      });

      const svcTitle = created.service?.name || created.service?.title || newSvc.title;
      const svcDesc = created.customDescription || created.description || created.service?.description || newSvc.description;
      const createdPrice = created.customPrice ?? created.basePrice ?? newSvc.basePrice;

      setServices((prev) => [
        {
          id: created.id,
          category: created.service?.category?.slug || newSvc.category,
          title: svcTitle,
          description: svcDesc,
          pricingModel: toProviderPricingModel(created.pricingModel || created.service?.pricingModel),
          basePrice: createdPrice ? Number(createdPrice) : undefined,
          minDuration: created.minDuration || '1–2 hours',
          serviceArea: 'Assigned service territory',
          isActive: created.isActive,
        },
        ...prev,
      ]);

      setFeedback({ type: 'success', message: `Added "${svcTitle}" to your service offerings.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to add service',
      });
    }
  };

  const handleUpdate = async (updatedSvc: ProviderServiceItem) => {
    try {
      setFeedback(null);
      const updated = await providerService.updateService(updatedSvc.id, {
        customDescription: updatedSvc.description,
        description: updatedSvc.description,
        basePrice: updatedSvc.basePrice,
        customPrice: updatedSvc.basePrice,
        pricingModel: toCatalogPricingModel(updatedSvc.pricingModel),
        isActive: updatedSvc.isActive,
      });

      const updatedPrice = updated.customPrice ?? updated.basePrice ?? updatedSvc.basePrice;

      setServices((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                description: updated.customDescription || updated.description || s.description,
                basePrice: updatedPrice ? Number(updatedPrice) : undefined,
                pricingModel: toProviderPricingModel(updated.pricingModel || s.pricingModel),
                isActive: updated.isActive,
              }
            : s
        )
      );

      setFeedback({ type: 'success', message: 'Service package updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update service',
      });
    }
  };

  const handleDelete = async (svcId: string) => {
    try {
      setFeedback(null);
      await providerService.removeService(svcId);
      setServices((prev) => prev.filter((s) => s.id !== svcId));
      setFeedback({ type: 'success', message: 'Service removed from your catalog.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to remove service',
      });
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="xl" className="py-16 text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
        <p className="text-sm text-neutral-600">Loading your offered services and trade packages...</p>
      </PageContainer>
    );
  }

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

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? 'Success' : 'Error'}
          onClose={() => setFeedback(null)}
        >
          <span>{feedback.message}</span>
        </Alert>
      )}

      <ProviderServices
        services={services}
        onAddService={handleAdd}
        onUpdateService={handleUpdate}
        onDeleteService={handleDelete}
      />
    </PageContainer>
  );
};
