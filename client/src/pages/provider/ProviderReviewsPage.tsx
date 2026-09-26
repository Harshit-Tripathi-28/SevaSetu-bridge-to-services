import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { NoReviewsState } from '../../components/provider/ProviderEmptyStates';
import type { ProviderReviewItem } from '../../types';

export const ProviderReviewsPage: React.FC = () => {
  const [filterRating, setFilterRating] = useState<string>('all');

  // Honest state: client reviews will be rendered upon verified job completion in future phases.
  const [reviews] = useState<ProviderReviewItem[]>([]);

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Client Reviews &amp; Ratings"
        description="Verified customer feedback, service satisfaction ratings, and trade performance metrics."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Reviews' },
        ]}
      />

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
                <span className="text-4xl font-bold text-neutral-900 font-mono">0.0</span>
                <div className="flex items-center justify-center gap-1 text-neutral-300">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={18} />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 pt-1">
                  Based on 0 verified client reviews
                </p>
              </div>

              {/* Star Rating Distribution Bars */}
              <div className="space-y-1.5 pt-3 border-t border-neutral-100 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-neutral-600">
                    <span className="w-12 text-left font-mono">{stars} star</span>
                    <div className="flex-1 bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-0" />
                    </div>
                    <span className="w-6 text-right font-mono text-neutral-400">0</span>
                  </div>
                ))}
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
              {reviews.length === 0 ? (
                <NoReviewsState />
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">{rev.customerNameMasked}</span>
                        <span className="text-neutral-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={13} className="fill-amber-400" />
                        ))}
                      </div>
                      {rev.comment && <p className="text-neutral-700 leading-relaxed">{rev.comment}</p>}
                    </div>
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
