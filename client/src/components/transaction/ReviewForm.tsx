import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  User,
  HeartHandshake,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Checkbox } from '../ui/Checkbox';
import { RatingInput } from './RatingInput';
import type { ReviewSubmissionData, ServiceAspectRatings } from '../../types';

export interface ReviewFormProps {
  bookingId: string;
  serviceTitle: string;
  provider?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  existingReview?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  onSubmitReview?: (reviewData: ReviewSubmissionData) => Promise<void> | void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  bookingId,
  serviceTitle,
  provider,
  existingReview,
  onSubmitReview,
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [aspects, setAspects] = useState<ServiceAspectRatings>({
    punctuality: 0,
    quality: 0,
    cleanliness: 0,
    communication: 0,
  });
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select an overall star rating (1 to 5 stars).');
      return;
    }

    setError(null);
    const reviewData: ReviewSubmissionData = {
      bookingId,
      providerId: provider?.id || 'unassigned',
      serviceTitle,
      rating,
      comment,
      aspects,
      isAnonymous,
    };

    try {
      setIsSubmitting(true);
      if (onSubmitReview) {
        await onSubmitReview(reviewData);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already reviewed or just submitted
  if (submitted || existingReview) {
    return (
      <Card variant="default" padding="lg" className="max-w-xl mx-auto text-center space-y-4">
        <CardContent className="space-y-4 py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900">
              Review Submitted
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto">
              Thank you for sharing your experience. Authentic reviews empower local service providers and help fellow neighborhood residents.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Your Rating:</span>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: existingReview?.rating || rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
            </div>
            {(existingReview?.comment || comment) && (
              <p className="text-neutral-700 italic border-t border-neutral-200 pt-1.5">
                "{existingReview?.comment || comment}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="md" className="max-w-2xl mx-auto space-y-6">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Booking #{bookingId}
            </span>
            <CardTitle className="text-lg sm:text-xl">
              Rate Your Experience: {serviceTitle}
            </CardTitle>
          </div>
          <HeartHandshake className="text-primary-600 shrink-0" size={24} />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Card (if assigned) */}
          {provider && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-sm">
                {provider.avatarUrl ? (
                  <img
                    src={provider.avatarUrl}
                    alt={provider.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div>
                <span className="text-xs text-neutral-500 block">Service Professional</span>
                <span className="text-sm font-semibold text-neutral-900">{provider.fullName}</span>
              </div>
            </div>
          )}

          {/* Overall Star Rating */}
          <div className="space-y-2 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <span className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Overall Service Rating *
            </span>
            <RatingInput
              value={rating}
              onChange={(newRating) => {
                setRating(newRating);
                if (error) setError(null);
              }}
              size="lg"
              ariaLabel="Overall rating"
            />
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          {/* Aspect Ratings (Optional) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-neutral-700 block">
              Detailed Criteria (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200 bg-white">
              <RatingInput
                value={aspects.quality || 0}
                onChange={(v) => setAspects((prev) => ({ ...prev, quality: v }))}
                label="Workmanship &amp; Quality"
                size="sm"
              />
              <RatingInput
                value={aspects.punctuality || 0}
                onChange={(v) => setAspects((prev) => ({ ...prev, punctuality: v }))}
                label="Punctuality &amp; Timing"
                size="sm"
              />
              <RatingInput
                value={aspects.cleanliness || 0}
                onChange={(v) => setAspects((prev) => ({ ...prev, cleanliness: v }))}
                label="Cleanliness &amp; Site Care"
                size="sm"
              />
              <RatingInput
                value={aspects.communication || 0}
                onChange={(v) => setAspects((prev) => ({ ...prev, communication: v }))}
                label="Politeness &amp; Guidance"
                size="sm"
              />
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="block text-xs font-semibold text-neutral-800">
              Written Feedback (Optional)
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the service outcome, technician professionalism, or anything helpful for neighborhood clients..."
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Be constructive, polite, and factual.</span>
              <span>{comment.length} / 1000</span>
            </div>
          </div>

          {/* Privacy & Anonymous Option */}
          <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
            <Checkbox
              id="anonymous-review"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              label="Submit as Anonymous Customer"
              helperText="Your profile name will be masked (e.g. Verified Neighbor) on public provider profiles."
            />
          </div>

          {/* Form Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Star size={14} />}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
