import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxStars?: number;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  maxStars = 5,
  label,
  disabled = false,
  size = 'md',
  ariaLabel = 'Rating',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 18,
    md: 24,
    lg: 32,
  };

  const currentScore = hoverRating !== null ? hoverRating : value;

  const ratingDescriptions: Record<number, string> = {
    1: 'Poor / Unsatisfactory',
    2: 'Fair / Below Expectation',
    3: 'Average / Good',
    4: 'Very Good / High Quality',
    5: 'Excellent / Exceptional Service',
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-neutral-800">
          {label}
        </label>
      )}

      <div
        className="flex items-center gap-1.5"
        role="radiogroup"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverRating(null)}
      >
        {Array.from({ length: maxStars }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= currentScore;

          return (
            <button
              key={starNumber}
              type="button"
              role="radio"
              aria-checked={value === starNumber}
              aria-label={`${starNumber} of ${maxStars} stars`}
              disabled={disabled}
              onClick={() => onChange(starNumber)}
              onMouseEnter={() => setHoverRating(starNumber)}
              onFocus={() => setHoverRating(starNumber)}
              onBlur={() => setHoverRating(null)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' && starNumber < maxStars) {
                  e.preventDefault();
                  onChange(starNumber + 1);
                } else if (e.key === 'ArrowLeft' && starNumber > 1) {
                  e.preventDefault();
                  onChange(starNumber - 1);
                }
              }}
              className={cn(
                'p-1 rounded-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer',
                'hover:scale-110 active:scale-95',
                disabled && 'cursor-not-allowed opacity-50 hover:scale-100'
              )}
            >
              <Star
                size={starSizes[size]}
                className={cn(
                  'transition-colors',
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-neutral-300 hover:text-amber-300'
                )}
              />
            </button>
          );
        })}

        {/* Display Score Label */}
        {currentScore > 0 && (
          <span className="text-xs font-medium text-neutral-700 ml-2 animate-fadeIn">
            {ratingDescriptions[currentScore] || `${currentScore} Stars`}
          </span>
        )}
      </div>
    </div>
  );
};
