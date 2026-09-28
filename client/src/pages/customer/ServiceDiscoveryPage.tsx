import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Search, RefreshCw, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { ServiceSearchFilters } from '../../components/customer/discovery/ServiceSearchFilters';
import { ProviderResultCard } from '../../components/customer/provider/ProviderResultCard';
import { ProviderResultSkeleton } from '../../components/customer/provider/ProviderResultSkeleton';
import { catalogService } from '../../services/catalog.service';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';
import type { ServiceCategory, Service as CatalogService } from '@sevasetu/shared';
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

  // Real backend catalog state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Preview loading / mock inspection state
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeletonDemo, setShowSkeletonDemo] = useState(false);

  // Sync category param with filter state
  useEffect(() => {
    if (paramCategory) {
      setCategory(paramCategory);
    }
  }, [paramCategory]);

  // Load catalog categories and services from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        const [cats, svcs] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getServices(category ? { categorySlug: category } : undefined),
        ]);
        if (isMounted) {
          setCategories(cats);
          setServices(svcs);
        }
      } catch (err) {
        console.error('Failed to load service catalog:', err);
      } finally {
        if (isMounted) setLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [category]);

  const activeCategoryObj = categories.find((c) => c.slug === category);

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
        categories={categories.length > 0 ? categories : CORE_SERVICE_CATEGORIES}
      />

      {/* Real Catalog Services Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary-700" />
            <h2 className="text-sm font-bold text-neutral-900">
              {activeCategoryObj ? `${activeCategoryObj.name} Services (${services.length})` : `Approved Platform Services (${services.length})`}
            </h2>
          </div>
          {loadingCatalog && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Loader2 size={12} className="animate-spin text-primary-600" />
              Loading catalog...
            </span>
          )}
        </div>

        {loadingCatalog ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-6 text-center border border-neutral-200 rounded-xl bg-neutral-50 text-xs text-neutral-600">
            No active services found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <Card key={svc.id} variant="default" padding="sm" className="bg-white hover:border-primary-300 transition-all flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="info" size="sm" className="text-[10px] uppercase font-bold">
                      {svc.pricingModel.replace('_', ' ')}
                    </Badge>
                    <Badge variant="success" size="sm" className="text-[9px]">
                      Active Catalog
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-neutral-900 line-clamp-1">{svc.name || svc.title}</CardTitle>
                  <CardDescription className="text-xs text-neutral-600 line-clamp-2 mt-1">
                    {svc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-mono">/{svc.slug}</span>
                  <Link to={`/service/${svc.slug}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary-700" rightIcon={<ArrowRight size={12} />}>
                      Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
