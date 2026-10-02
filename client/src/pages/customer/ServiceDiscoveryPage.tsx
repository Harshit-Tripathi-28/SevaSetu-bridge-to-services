import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Search, RefreshCw, Layers, ArrowRight, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { ServiceSearchFilters } from '../../components/customer/discovery/ServiceSearchFilters';
import { ProviderResultCard } from '../../components/customer/provider/ProviderResultCard';
import { ProviderResultSkeleton } from '../../components/customer/provider/ProviderResultSkeleton';
import { AiServiceRequestModal } from '../../components/customer/discovery/AiServiceRequestModal';
import { AiMatchBadge } from '../../components/customer/discovery/AiMatchBadge';
import { catalogService } from '../../services/catalog.service';
import { providerService } from '../../services/provider.service';
import { AiClientService } from '../../services/ai.service';
import { CORE_SERVICE_CATEGORIES } from '../../constants/categories';
import type {
  ServiceCategory,
  Service as CatalogService,
  ProviderSearchResultItem,
  ProviderSearchQuery,
  AiMatchExplanation,
} from '@sevasetu/shared';

export const ServiceDiscoveryPage: React.FC = () => {
  const { category: paramCategory } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(paramCategory || searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('loc') || '');
  const [preferredDate, setPreferredDate] = useState(searchParams.get('date') || '');
  const [preferredTime, setPreferredTime] = useState(searchParams.get('time') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
  const [page, setPage] = useState(1);

  // Real backend catalog state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Real backend providers search state
  const [providers, setProviders] = useState<ProviderSearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // AI Assistant and match explanation state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiMatchExplanations, setAiMatchExplanations] = useState<Record<string, AiMatchExplanation>>({});

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
      } catch (err: unknown) {
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

  // Execute Real Provider Search against PostgreSQL API
  const performSearch = useCallback(async () => {
    setLoadingProviders(true);
    setSearchError(null);

    try {
      const query: ProviderSearchQuery = {
        page,
        limit: 10,
        sortBy: sortBy === 'experience' ? 'experience' : 'recommended',
      };

      if (keyword.trim()) query.keyword = keyword.trim();
      if (category.trim()) query.categorySlug = category.trim();

      if (location.trim()) {
        const loc = location.trim();
        if (/^\d{6}$/.test(loc)) {
          query.postalCode = loc;
        } else {
          query.city = loc;
          query.locality = loc;
        }
      }

      if (preferredDate) {
        query.date = preferredDate;
        if (preferredTime) {
          query.startTime = preferredTime;
          query.durationHours = 1;
        }
      }

      const res = await providerService.searchProviders(query);
      setProviders(res.results);
      setTotalResults(res.total);
      setTotalPages(res.totalPages || 1);

      if (res.results.length > 0) {
        try {
          const rankRes = await AiClientService.rankProviders(
            res.results.map((p) => p.id),
            { categorySlug: category || undefined, taskDescription: keyword || undefined }
          );
          const map: Record<string, AiMatchExplanation> = {};
          for (const item of rankRes.rankedProviders) {
            map[item.providerProfileId] = item.matchExplanation;
          }
          setAiMatchExplanations(map);
        } catch {
          // AI ranking assistance failure must never break search
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to connect to search service';
      setSearchError(message);
      setProviders([]);
      setTotalResults(0);
    } finally {
      setLoadingProviders(false);
    }
  }, [keyword, category, location, preferredDate, preferredTime, sortBy, page]);

  // Trigger search on filter change (debounced for text inputs)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [performSearch]);

  const activeCategoryObj = categories.find((c) => c.slug === category);

  const handleResetFilters = () => {
    setKeyword('');
    setCategory('');
    setLocation('');
    setPreferredDate('');
    setPreferredTime('');
    setSortBy('recommended');
    setPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (val: string) => {
    setCategory(val);
    setPage(1);
    const newParams: Record<string, string> = {};
    if (val) newParams.category = val;
    if (keyword) newParams.q = keyword;
    if (location) newParams.loc = location;
    setSearchParams(newParams);
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
              onClick={() => setIsAiModalOpen(true)}
              style={{
                borderColor: '#c7d2fe',
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} className="mr-1.5 text-indigo-600" />
              Describe with AI
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
        onKeywordChange={(val) => {
          setKeyword(val);
          setPage(1);
        }}
        selectedCategory={category}
        onCategoryChange={handleCategorySelect}
        location={location}
        onLocationChange={(val) => {
          setLocation(val);
          setPage(1);
        }}
        preferredDate={preferredDate}
        onDateChange={(val) => {
          setPreferredDate(val);
          setPage(1);
        }}
        preferredTime={preferredTime}
        onTimeChange={(val) => {
          setPreferredTime(val);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortChange={(val) => {
          setSortBy(val);
          setPage(1);
        }}
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
                  <CardTitle className="text-sm font-bold text-neutral-900 line-clamp-1">{svc.title}</CardTitle>
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900">
              {loadingProviders ? 'Searching active providers...' : `${totalResults} Verified Professional${totalResults === 1 ? '' : 's'} Available`}
            </span>
            {category && (
              <Badge variant="neutral" size="sm">
                Category: {activeCategoryObj?.name || category}
              </Badge>
            )}
            {preferredDate && (
              <Badge variant="info" size="sm">
                Date: {preferredDate} {preferredTime ? `@ ${preferredTime}` : ''}
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={performSearch}
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer text-xs"
            disabled={loadingProviders}
          >
            <RefreshCw size={12} className={loadingProviders ? 'animate-spin' : ''} />
            <span>Refresh Results</span>
          </button>
        </div>

        {/* Server / Network Error Banner */}
        {searchError && (
          <Alert variant="error" title="Search Service Error">
            <div className="flex items-center justify-between">
              <span>{searchError}</span>
              <Button variant="outline" size="sm" onClick={performSearch} className="text-xs ml-4">
                Retry Search
              </Button>
            </div>
          </Alert>
        )}

        {/* Loading State Skeleton */}
        {loadingProviders ? (
          <div className="space-y-4">
            <ProviderResultSkeleton />
            <ProviderResultSkeleton />
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((p) => (
              <div key={p.id}>
                <ProviderResultCard provider={p} />
                <AiMatchBadge matchExplanation={aiMatchExplanations[p.id]} />
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl text-xs">
                <span className="text-neutral-600">
                  Page {page} of {totalPages} ({totalResults} total results)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    leftIcon={<ChevronLeft size={14} />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    rightIcon={<ChevronRight size={14} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Honest Empty State: Based on Real Database Results */
          <EmptyState
            icon={<Search size={26} className="text-neutral-400" />}
            title={
              keyword || category || location || preferredDate
                ? 'No verified providers match your exact filters'
                : 'No verified service providers currently listed'
            }
            description={
              keyword || category || location || preferredDate
                ? 'Try adjusting your search criteria, widening the service area, or choosing a different date/time.'
                : 'As verified providers complete onboarding and publish their schedules, they will appear here.'
            }
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Link to="/request">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle size={14} />}>
                    Submit Service Request
                  </Button>
                </Link>
                {(keyword || category || location || preferredDate) && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Active Filters
                  </Button>
                )}
              </div>
            }
          />
        )}
      </div>

      <AiServiceRequestModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        categories={categories}
        onApplySearch={({ categorySlug, keyword: kw, date, time }) => {
          if (categorySlug) setCategory(categorySlug);
          if (kw) setKeyword(kw);
          if (date) setPreferredDate(date);
          if (time) setPreferredTime(time);
          setPage(1);
        }}
      />
    </PageContainer>
  );
};
