import React from 'react';
import { Star, CheckCircle2, MessageSquareQuote } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import type { ReviewItem } from '../../types';

export interface ReviewCardProps {
  review: ReviewItem;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, className }) => {
  return (
    <Card variant="default" padding="sm" className={className}>
      <CardContent className="p-4 space-y-3 text-xs">
        {/* Top Header: Customer Masked Name, Date & Rating */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-900">{review.customerNameMasked}</span>
              {review.verifiedBooking && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.2 rounded">
                  <CheckCircle2 size={10} /> Verified Booking
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-500">{review.serviceTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={13}
                  className={
                    index < review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200'
                  }
                />
              ))}
            </div>
            <span className="text-neutral-400 font-mono text-[11px]">{review.createdAt}</span>
          </div>
        </div>

        {/* Written Review Body */}
        {review.comment && (
          <p className="text-neutral-700 leading-relaxed text-xs">
            {review.comment}
          </p>
        )}

        {/* Aspects Breakdown (if present) */}
        {review.aspects && (
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-neutral-500">
            {review.aspects.quality && (
              <span>Quality: <strong>{review.aspects.quality}/5</strong></span>
            )}
            {review.aspects.punctuality && (
              <span>Timing: <strong>{review.aspects.punctuality}/5</strong></span>
            )}
            {review.aspects.cleanliness && (
              <span>Cleanliness: <strong>{review.aspects.cleanliness}/5</strong></span>
            )}
            {review.aspects.communication && (
              <span>Politeness: <strong>{review.aspects.communication}/5</strong></span>
            )}
          </div>
        )}

        {/* Provider Response (if present) */}
        {review.providerResponse && (
          <div className="mt-2 p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-800">
              <span className="flex items-center gap-1">
                <MessageSquareQuote size={13} className="text-primary-600" />
                <span>Response from Provider</span>
              </span>
              <span className="text-neutral-400 font-mono font-normal">
                {review.providerResponse.respondedAt}
              </span>
            </div>
            <p className="text-neutral-600 text-xs italic">
              "{review.providerResponse.comment}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
