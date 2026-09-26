import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bookingNotice, setBookingNotice] = useState(false);

  // Match against core category if id matches a known slug
  const matchedCategory = CORE_SERVICE_CATEGORIES.find(
    (c) => c.slug === id || c.id === id
  );

  // If no matching category or generic ID
  const serviceTitle = matchedCategory ? `${matchedCategory.name} Service Package` : `Service Specification (${id})`;
  const categoryName = matchedCategory ? matchedCategory.name : 'Home & Local Services';

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
        title={serviceTitle}
        description={`Comprehensive ${categoryName.toLowerCase()} performed by certified and background-verified local specialists.`}
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: categoryName, href: `/services/${matchedCategory?.slug || ''}` },
          { label: 'Service Detail' },
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
              <Link to={`/request?category=${matchedCategory?.slug || ''}`}>
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
                <Badge variant="neutral" size="sm">Standard Tier</Badge>
              </div>
              <CardTitle className="pt-2">Service Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm text-neutral-700 leading-relaxed">
              <p>
                {matchedCategory?.description ||
                  'Professional local service execution adhering to SevaSetu verified safety and quality standards.'}
              </p>
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
                <span className="text-2xl font-bold text-neutral-900 font-mono">Transparent</span>
                <span className="text-xs text-neutral-600">Estimate provided upfront</span>
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
              <Link to={`/request?category=${matchedCategory?.slug || ''}`} className="w-full">
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
