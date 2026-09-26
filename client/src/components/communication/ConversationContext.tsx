import React from 'react';
import { Briefcase, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ConversationContextData } from '../../types';

export interface ConversationContextProps {
  context: ConversationContextData;
  className?: string;
}

export const ConversationContext: React.FC<ConversationContextProps> = ({
  context,
  className,
}) => {
  return (
    <div
      className={`px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200 text-xs text-neutral-600 flex flex-wrap items-center justify-between gap-3 ${
        className || ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
          <Briefcase size={13} className="text-neutral-500" />
          <span>{context.serviceTitle}</span>
        </div>

        {context.bookingId && (
          <span className="font-mono text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded text-[11px]">
            Booking #{context.bookingId}
          </span>
        )}

        {context.scheduledDate && (
          <div className="flex items-center gap-1 text-[11px]">
            <Calendar size={12} className="text-neutral-400" />
            <span>{context.scheduledDate}</span>
          </div>
        )}

        {context.locationSummary && (
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <MapPin size={12} className="text-neutral-400" />
            <span className="truncate max-w-xs">{context.locationSummary}</span>
          </div>
        )}
      </div>

      {context.bookingId && (
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-800"
        >
          <span>View Details</span>
          <ExternalLink size={11} />
        </Link>
      )}
    </div>
  );
};
