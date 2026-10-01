import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { NoReviewsState } from '../../components/provider/ProviderEmptyStates';
import { ReviewCard } from '../../components/transaction/ReviewCard';
import { ReviewService } from '../../services/review.service';
import type { ReviewItem } from '../../types';

export const ProviderReviewsPage: React.FC = () => {
  const [filterRating, setFilterRating] = useState<string>('all');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await ReviewService.getProviderOwnReviews();
      const mapped: ReviewItem[] = data.reviews.map((r) => ({
        id: r.id,
        customerNameMasked: r.customerName || 'Verified Customer',
        serviceTitle: 'Completed Service',
        verifiedBooking: true,
        rating: r.overallRating,
        comment: r.reviewText || '',
        createdAt: new Date(r.createdAt).toLocaleDateString(),
        aspects: {
          punctuality: r.punctuality ?? undefined,
          quality: r.workmanship ?? undefined,
          cleanliness: r.cleanliness ?? undefined,
          communication: r.communication ?? undefined,
        },
      }));
      setReviews(mapped);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === parseInt(filterRating, 10);
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
        ).toFixed(1)
      : '0.0';

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Client Reviews &amp; Ratings"
        description="Verified customer feedback, service satisfaction ratings, and trade performance metrics."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Reviews' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={fetchReviews}
            disabled={isLoading}
          >
            Refresh
          </Button>
        }
      />

      {errorMessage && (
        <Alert variant="error" title="Failed to load reviews" onClose={() => setErrorMessage(null)}>
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        </Alert>
      )}

      {/* Rating Breakdown & Average Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Rating Score Summary Card */}
        <div className="md:col-span-4 space-y-4">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-base">Rating Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-1">
                <span className="text-4xl font-bold text-neutral-900 font-mono">
                  {averageRating}
                </span>
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={18}
                      className={
                        s <= Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-200'
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 pt-1">
                  Based on {totalReviews} verified client reviews
                </p>
              </div>

              {/* Star Rating Distribution Bars */}
              <div className="space-y-1.5 pt-3 border-t border-neutral-100 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const countForStar = reviews.filter((r) => r.rating === stars).length;
                  const pct = totalReviews > 0 ? (countForStar / totalReviews) * 100 : 0;

                  return (
                    <div key={stars} className="flex items-center gap-2 text-neutral-600">
                      <span className="w-12 text-left font-mono">{stars} star</span>
                      <div className="flex-1 bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-neutral-400">
                        {countForStar}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Reviews Feed */}
        <div className="md:col-span-8 space-y-4">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">Customer Feedback</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-neutral-400" />
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="h-8 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    aria-label="Filter reviews by rating"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredReviews.length === 0 ? (
                <NoReviewsState />
              ) : (
                <div className="space-y-3">
                  {filteredReviews.map((rev) => (
                    <ReviewCard key={rev.id} review={rev} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Genuine Review Standards Notice */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              All feedback is verified from completed bookings. Authentic ratings boost your provider matching score in local customer searches.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
