import React from 'react';
import { Loader2, AlertTriangle, WifiOff, Clock, UserX, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';

export interface RequestStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export const RequestLoadingState: React.FC<{
  message?: string;
  subtext?: string;
  className?: string;
}> = ({
  message = 'Processing service request...',
  subtext = 'Validating parameters and preparing matching framework',
  className,
}) => (
  <Card variant="default" padding="lg" className={cn('bg-white text-center py-10', className)}>
    <CardContent className="flex flex-col items-center justify-center space-y-3">
      <Loader2 size={32} className="animate-spin text-primary-600" />
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-neutral-900">{message}</h4>
        <p className="text-xs text-neutral-500 max-w-sm">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);

export const AvailabilityUnavailableState: React.FC<{
  selectedDate?: string;
  onSelectDifferentDate?: () => void;
  className?: string;
}> = ({
  selectedDate,
  onSelectDifferentDate,
  className,
}) => (
  <div className={cn('p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 space-y-2', className)}>
    <div className="flex items-center gap-2 font-semibold text-xs">
      <Clock size={15} className="text-amber-700 shrink-0" />
      <span>Real-time provider availability window</span>
    </div>
    <p className="text-xs text-amber-800 leading-relaxed">
      {selectedDate
        ? `Availability data for ${selectedDate} will be updated once local verified specialists in your pincode acknowledge the dispatch.`
        : 'Select an appointment date above to view scheduling slots.'}
    </p>
    {onSelectDifferentDate && (
      <button
        type="button"
        onClick={onSelectDifferentDate}
        className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer pt-1"
      >
        Choose alternative date
      </button>
    )}
  </div>
);

export const ProviderUnavailableState: React.FC<{
  categoryName?: string;
  onSelectDifferentCategory?: () => void;
  className?: string;
}> = ({
  categoryName,
  onSelectDifferentCategory,
  className,
}) => (
  <div className={cn('p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 space-y-2', className)}>
    <div className="flex items-center gap-2 font-semibold text-xs text-neutral-900">
      <UserX size={15} className="text-neutral-600 shrink-0" />
      <span>Provider matching notice</span>
    </div>
    <p className="text-xs text-neutral-600 leading-relaxed">
      Currently matching against all registered local partners in {categoryName || 'this sector'}. Specific provider profiles will become selectable upon live backend dispatch.
    </p>
    {onSelectDifferentCategory && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSelectDifferentCategory}
        className="text-xs mt-1"
      >
        Change Category
      </Button>
    )}
  </div>
);

export const RequestSubmissionFailedState: React.FC<RequestStateProps> = ({
  title = 'Submission Encountered an Error',
  description = 'Unable to log your request to the matching pipeline. Please check your network connection and retry.',
  onRetry,
  className,
}) => (
  <Card variant="default" padding="lg" className={cn('bg-white border-rose-200 text-center py-8', className)}>
    <CardContent className="flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
        <AlertTriangle size={24} />
      </div>
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-neutral-900">{title}</h4>
        <p className="text-xs text-neutral-600 max-w-sm mx-auto">{description}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<RotateCcw size={14} />}
          onClick={onRetry}
          className="mt-2"
        >
          Retry Submission
        </Button>
      )}
    </CardContent>
  </Card>
);

export const NetworkErrorNotice: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => (
  <div className={cn('flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800', className)}>
    <WifiOff size={16} className="text-rose-600 shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <p className="font-semibold">Network connection offline or unreachable</p>
      <p className="text-rose-700">Please check your internet connection before proceeding with the request.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-rose-900 font-semibold underline text-xs cursor-pointer"
        >
          Check again
        </button>
      )}
    </div>
  </div>
);
