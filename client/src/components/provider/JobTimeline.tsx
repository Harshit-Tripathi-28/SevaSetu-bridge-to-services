import React from 'react';
import {
  Check,
  Clock,
  Truck,
  MapPin,
  PlayCircle,
  CheckCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ProviderJobStatus } from '../../types';

export interface TimelineStepDef {
  status: ProviderJobStatus;
  label: string;
  icon: React.ReactNode;
}

const JOB_STEPS: TimelineStepDef[] = [
  { status: 'scheduled', label: 'Scheduled', icon: <Clock size={14} /> },
  { status: 'on_the_way', label: 'On the Way', icon: <Truck size={14} /> },
  { status: 'arrived', label: 'Arrived', icon: <MapPin size={14} /> },
  { status: 'in_progress', label: 'In Progress', icon: <PlayCircle size={14} /> },
  { status: 'completed', label: 'Completed', icon: <CheckCheck size={14} /> },
];

export interface JobTimelineProps {
  currentStatus: ProviderJobStatus;
  className?: string;
  timestamp?: string;
}

export const JobTimeline: React.FC<JobTimelineProps> = ({
  currentStatus,
  className,
}) => {
  const currentStepIndex = JOB_STEPS.findIndex((s) => s.status === currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className={cn('p-3 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-600', className)}>
        <p className="font-semibold text-neutral-800">Job Cancelled</p>
        <p className="text-[11px] text-neutral-500">This service booking was marked cancelled.</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full py-2', className)}>
      <ol className="flex items-center justify-between w-full">
        {JOB_STEPS.map((step, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;

          return (
            <li
              key={step.status}
              className={cn(
                'flex-1 flex items-center relative',
                idx !== JOB_STEPS.length - 1 && 'after:content-[""] after:w-full after:h-0.5 after:mx-1 sm:after:mx-2 after:transition-colors',
                idx !== JOB_STEPS.length - 1 && (isDone ? 'after:bg-primary-600' : 'after:bg-neutral-200')
              )}
            >
              <div className="flex flex-col items-center group">
                <span
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-colors shrink-0 shadow-2xs',
                    isDone
                      ? 'bg-primary-600 text-white'
                      : isCurrent
                      ? 'bg-primary-50 border-2 border-primary-600 text-primary-700 font-bold ring-4 ring-primary-50'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  )}
                  title={step.label}
                >
                  {isDone ? <Check size={14} className="stroke-3" /> : step.icon}
                </span>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-medium mt-1.5 text-center hidden sm:block',
                    isCurrent
                      ? 'text-primary-800 font-bold'
                      : isDone
                      ? 'text-neutral-700'
                      : 'text-neutral-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
