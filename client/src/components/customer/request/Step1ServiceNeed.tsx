import React from 'react';
import { Sparkles, ArrowRight, Layers, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { CORE_SERVICE_CATEGORIES } from '../../../constants/categories';
import { cn } from '../../../lib/utils';

export interface Step1ServiceNeedProps {
  serviceNeed: string;
  onChangeNeed: (value: string) => void;
  category: string;
  onChangeCategory: (value: string) => void;
  errorNeed?: string;
  errorCategory?: string;
  onContinue: () => void;
}

export const Step1ServiceNeed: React.FC<Step1ServiceNeedProps> = ({
  serviceNeed,
  onChangeNeed,
  category,
  onChangeCategory,
  errorNeed,
  errorCategory,
  onContinue,
}) => {
  const MAX_CHARS = 500;

  return (
    <div className="space-y-6">
      {/* 1. Natural Language Entry Card */}
      <Card variant="elevated" padding="md" className="border-primary-100 bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
            <Sparkles size={16} />
            <span>Step 1: State Your Requirement</span>
          </div>
          <CardTitle>Tell us what you need</CardTitle>
          <CardDescription>
            Describe your problem or service requirement in your own words. We will structure your details in the following steps.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-2">
          <Textarea
            rows={4}
            value={serviceNeed}
            maxLength={MAX_CHARS}
            onChange={(e) => onChangeNeed(e.target.value)}
            placeholder="e.g., I need a certified electrician to install a ceiling fan in the master bedroom, and check a loose switchboard in the hallway..."
            error={errorNeed}
            required
            aria-label="Describe what service you need"
          />

          <div className="flex items-center justify-between text-xs text-neutral-600 px-1 pt-1">
            <span>Minimum 10 characters describing the work needed.</span>
            <span className={cn('font-mono', serviceNeed.length > 450 ? 'text-amber-600 font-bold' : 'text-neutral-600')}>
              {serviceNeed.length}/{MAX_CHARS}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Primary Category Selection */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-700 font-semibold text-xs mb-1">
            <Layers size={15} />
            <span>Classification</span>
          </div>
          <CardTitle>Select Primary Service Category</CardTitle>
          <CardDescription>
            Choose the core domain that best fits your requirement.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {errorCategory && (
            <div className="flex items-center gap-2 text-rose-700 text-xs font-medium p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorCategory}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Service Category">
            {CORE_SERVICE_CATEGORIES.map((cat) => {
              const isSelected = category === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChangeCategory(cat.slug)}
                  className={cn(
                    'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isSelected
                      ? 'bg-primary-50/80 border-primary-500 ring-1 ring-primary-500 text-primary-950'
                      : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900'
                  )}
                >
                  <span className="font-semibold text-xs sm:text-sm leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-neutral-600 line-clamp-1 mt-0.5">
                    {cat.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-neutral-100 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} />}
            onClick={onContinue}
          >
            Continue to Service Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
