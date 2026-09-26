import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface StepItem {
  id: number;
  label: string;
  shortLabel: string;
}

export const REQUEST_STEPS: StepItem[] = [
  { id: 1, label: 'Service Need', shortLabel: 'Need' },
  { id: 2, label: 'Service Details', shortLabel: 'Details' },
  { id: 3, label: 'Service Location', shortLabel: 'Location' },
  { id: 4, label: 'Date & Time', shortLabel: 'Schedule' },
  { id: 5, label: 'Preferences', shortLabel: 'Notes' },
  { id: 6, label: 'Review & Confirm', shortLabel: 'Review' },
];

export interface RequestStepIndicatorProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  maxCompletedStep: number;
  className?: string;
}

export const RequestStepIndicator: React.FC<RequestStepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxCompletedStep,
  className,
}) => {
  const currentStepObj = REQUEST_STEPS.find((s) => s.id === currentStep) ?? REQUEST_STEPS[0]!;
  const progressPercent = ((currentStep) / REQUEST_STEPS.length) * 100;

  return (
    <div className={cn('w-full space-y-3 select-none', className)}>
      {/* Mobile Compact Progress (<md) */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-900">
            Step {currentStep} of {REQUEST_STEPS.length}:{' '}
            <span className="text-primary-700">{currentStepObj.label}</span>
          </span>
          <span className="text-[11px] font-mono text-neutral-600">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop Horizontal Step Wizard (>=md) */}
      <nav aria-label="Request Progress Steps" className="hidden md:block">
        <ol className="flex items-center justify-between">
          {REQUEST_STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = step.id <= maxCompletedStep && onStepClick;

            return (
              <li
                key={step.id}
                className={cn(
                  'flex-1 flex items-center relative',
                  idx !== REQUEST_STEPS.length - 1 && 'after:content-[""] after:w-full after:h-0.5 after:mx-2 after:transition-colors',
                  idx !== REQUEST_STEPS.length - 1 && (step.id < currentStep ? 'after:bg-primary-600' : 'after:bg-neutral-200')
                )}
              >
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2 text-xs transition-all shrink-0 rounded-lg p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  )}
                >
                  {/* Step Circle */}
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs transition-colors shrink-0',
                      isCompleted
                        ? 'bg-primary-600 text-white'
                        : isCurrent
                        ? 'bg-primary-50 border-2 border-primary-600 text-primary-700 font-bold'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    )}
                  >
                    {isCompleted ? <Check size={14} className="stroke-3" /> : step.id}
                  </span>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'hidden lg:inline-block font-medium truncate max-w-[100px]',
                      isCurrent
                        ? 'text-neutral-900 font-semibold'
                        : isCompleted
                        ? 'text-neutral-700'
                        : 'text-neutral-600'
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
