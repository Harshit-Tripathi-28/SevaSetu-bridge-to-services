import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { catalogService } from '../../services/catalog.service';
import type { Service as CatalogService } from '@sevasetu/shared';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<CatalogService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingNotice, setBookingNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadService() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await catalogService.getService(id);
        if (isMounted) setService(data);
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Service not found in catalog';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadService();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer maxWidth="lg" className="py-16 text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
        <p className="text-sm text-neutral-600">Loading service details from platform catalog...</p>
      </PageContainer>
    );
  }

  if (error || !service) {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<AlertCircle size={28} className="text-rose-500" />}
          title="Catalog Service Not Found"
          description={error || `The service "${id}" is either inactive or does not exist in the database.`}
          action={
            <Link to="/services">
              <Button size="sm" variant="primary">
                Return to Service Catalog
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const categoryName = service.category?.name || service.categoryName || 'Home & Local Services';
  const categorySlug = service.category?.slug || '';
  const serviceName = service.name || service.title || 'Service Detail';

  const includedItems = [
    'Initial diagnostic and requirement assessment on arrival',
    'Standard labor and execution using professional tools',
    'Post-service quality check and area clean-up',
    'Transparent pricing with formal itemized estimate if additional parts required',
  ];

  return (
    <PageContainer maxWidth="lg" className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={serviceName}
        description={service.description}
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: categoryName, href: `/services?category=${categorySlug}` },
          { label: serviceName },
        ]}
      />

      {bookingNotice && (
        <Alert
          variant="info"
          title="Direct Booking Framework"
          onClose={() => setBookingNotice(false)}
        >
          <div className="space-y-1 text-xs sm:text-sm">
            <p>
              Direct instant booking and payment gateways will be activated in upcoming platform phases.
            </p>
            <p className="text-neutral-600">
              You can submit your service requirements right now via the structured service request form.
            </p>
            <div className="pt-2">
              <Link to={`/request?category=${categorySlug}&service=${service.slug}`}>
                <Button size="sm" variant="primary">
                  Go to Request Form
                </Button>
              </Link>
            </div>
          </div>
        </Alert>
      )}

      {/* Main Grid: Details + Action Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Service Specifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Description Card */}
          <Card variant="default" padding="md">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">{categoryName}</Badge>
                <Badge variant="neutral" size="sm" className="uppercase font-mono text-[10px]">
                  {service.pricingModel.replace('_', ' ')}
                </Badge>
              </div>
              <CardTitle className="pt-2">{serviceName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm text-neutral-700 leading-relaxed">
              <p>{service.description}</p>
              <p>
                Our verified service partners are equipped with standard tools, safety gear, and background checks to guarantee a seamless home service experience.
              </p>
            </CardContent>
          </Card>

          {/* What is Included Card */}
          <Card variant="default" padding="md">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle>What Is Included</CardTitle>
              <CardDescription>Standard scope of work for this service category.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 text-xs sm:text-sm text-neutral-700">
                {includedItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Safety & Trust Framework */}
          <Card variant="subtle" padding="md" className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-neutral-900 text-sm">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>SevaSetu Quality Assurance Standards</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Every provider on the SevaSetu platform undergoes mandatory verification checks before accepting appointments. We uphold fair compensation guidelines and transparent billing for all tasks.
            </p>
          </Card>
        </div>

        {/* Right Column (1 Col): Pricing Model & Request CTA */}
        <div className="space-y-6">
          <Card variant="elevated" padding="md" className="space-y-6">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Pricing Structure
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-bold text-neutral-900 font-mono">
                  {service.pricingModel.replace('_', ' ')}
                </span>
                <span className="text-xs text-neutral-600">Standard rate model</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-xs text-neutral-600">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-neutral-400" />
                  <span>Standard Duration</span>
                </span>
                <span className="font-semibold text-neutral-900">1 – 2 Hours</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-neutral-400" />
                  <span>Service Delivery</span>
                </span>
                <span className="font-semibold text-neutral-900">At Customer Site</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-neutral-400" />
                  <span>Cancellation Policy</span>
                </span>
                <span className="font-semibold text-emerald-700">Free before dispatch</span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5 pt-4">
              <Link to={`/request?category=${categorySlug}&service=${service.slug}`} className="w-full">
                <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight size={16} />}>
                  Request This Service
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setBookingNotice(true)}
              >
                Instant Booking Info
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
