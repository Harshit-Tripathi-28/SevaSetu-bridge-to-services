import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ServiceSearchFilters } from '../../components/customer/discovery/ServiceSearchFilters';
import { ProviderResultCard } from '../../components/customer/provider/ProviderResultCard';
import { ProviderResultSkeleton } from '../../components/customer/provider/ProviderResultSkeleton';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';
import type { ProviderSummary } from '../../types';

export const ServiceDiscoveryPage: React.FC = () => {
  const { category: paramCategory } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(paramCategory || searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('loc') || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  // Preview loading / mock inspection state
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  // Sync category param with filter state
  useEffect(() => {
    if (paramCategory) {
      setCategory(paramCategory);
    }
  }, [paramCategory]);

  const activeCategoryObj = CORE_SERVICE_CATEGORIES.find((c) => c.slug === category);

  const handleResetFilters = () => {
    setKeyword('');
    setCategory('');
    setLocation('');
    setPreferredDate('');
    setSortBy('recommended');
    setSearchParams({});
  };

  // Real backend providers array: currently empty because provider registration / onboarding is in later phases
  const providers: ProviderSummary[] = [];

  const handleTriggerSimulatedFetch = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-6">
      {/* Page Header with dynamic breadcrumbs */}
      <PageHeader
        title={activeCategoryObj ? `${activeCategoryObj.name} Services` : 'Service Discovery'}
        description={
          activeCategoryObj
            ? activeCategoryObj.description
            : 'Find and compare local verified professionals across all service categories.'
        }
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          ...(activeCategoryObj ? [{ label: activeCategoryObj.name }] : [{ label: 'All Services' }]),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSkeletonDemo(!showSkeletonDemo)}
            >
              {showSkeletonDemo ? 'Hide Skeleton Preview' : 'Preview Loading State'}
            </Button>
            <Link to="/request">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />}>
                Request Custom Service
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Bar Component */}
      <ServiceSearchFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        selectedCategory={category}
        onCategoryChange={(val) => {
          setCategory(val);
          if (val) {
            setSearchParams({ category: val });
          } else {
            setSearchParams({});
          }
        }}
        location={location}
        onLocationChange={setLocation}
        preferredDate={preferredDate}
        onDateChange={setPreferredDate}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleResetFilters}
        categories={CORE_SERVICE_CATEGORIES}
      />

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">
              {showSkeletonDemo ? 'Loading preview...' : `${providers.length} Verified Professionals Available`}
            </span>
            {category && (
              <Badge variant="neutral" size="sm">
                Category: {activeCategoryObj?.name || category}
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={handleTriggerSimulatedFetch}
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Results</span>
          </button>
        </div>

        {/* Loading Skeleton Demo Mode */}
        {isLoading || showSkeletonDemo ? (
          <div className="space-y-4">
            <ProviderResultSkeleton />
            <ProviderResultSkeleton />
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((p) => (
              <ProviderResultCard key={p.id} provider={p} />
            ))}
          </div>
        ) : (
          /* Honest Empty State: No fabricated profiles */
          <EmptyState
            icon={<Search size={26} className="text-neutral-400" />}
            title="No verified service providers currently listed"
            description="Provider registration and live service matching will be onboarded in upcoming platform phases. You can submit a structured service request in the meantime."
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Link to="/request">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />}>
                    Submit Service Request
                  </Button>
                </Link>
                {(keyword || category || location) && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Active Filters
                  </Button>
                )}
              </div>
            }
          />
        )}
      </div>
    </PageContainer>
  );
};
