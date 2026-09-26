import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, MapPin, RotateCcw, Activity } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import type { RequestConfirmationData } from '../../../types';

export interface ConfirmationSuccessStateProps {
  confirmation: RequestConfirmationData;
  onReset: () => void;
}

export const ConfirmationSuccessState: React.FC<ConfirmationSuccessStateProps> = ({
  confirmation,
  onReset,
}) => {
  return (
    <Card variant="elevated" padding="lg" className="bg-white text-center space-y-6">
      {/* Success Icon & Headline */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/60 shadow-xs">
          <ShieldCheck size={32} />
        </div>

        <div className="space-y-1">
          <Badge variant="success" size="md" withDot className="mx-auto">
            Request Logged
          </Badge>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Service Request Successfully Captured
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto">
            Your service requirements have been verified and registered with reference ID:
          </p>
          <div className="pt-1">
            <span className="font-mono font-bold text-sm bg-neutral-100 text-neutral-800 px-3 py-1 rounded-md border border-neutral-200 inline-block">
              {confirmation.referenceId}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Summary Box */}
      <div className="max-w-lg mx-auto p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 text-left space-y-3 text-xs text-neutral-700">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <span className="text-neutral-600 font-medium">Service Domain:</span>
          <span className="font-semibold text-neutral-900">{confirmation.categoryName} ({confirmation.serviceType})</span>
        </div>

        <div className="flex items-start justify-between pb-2 border-b border-neutral-200">
          <span className="text-neutral-600 font-medium flex items-center gap-1">
            <Calendar size={13} className="text-neutral-400" />
            <span>Schedule:</span>
          </span>
          <span className="font-semibold text-neutral-900 text-right">
            {confirmation.scheduledDate} ({confirmation.timeSlotLabel})
          </span>
        </div>

        <div className="flex items-start justify-between">
          <span className="text-neutral-600 font-medium flex items-center gap-1">
            <MapPin size={13} className="text-neutral-400" />
            <span>Location:</span>
          </span>
          <span className="font-semibold text-neutral-900 text-right max-w-xs truncate">
            {confirmation.locationSummary}
          </span>
        </div>
      </div>

      {/* What Happens Next Guidance */}
      <div className="max-w-lg mx-auto text-left space-y-2 pt-2">
        <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
          What Happens Next
        </h4>
        <div className="space-y-2 text-xs text-neutral-600">
          <p className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
            <span>Local verified professionals in your sector receive your task details.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
            <span>You will receive an upfront quote and arrival confirmation notice.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
            <span>Track the progress in real-time under your Customer Activity dashboard.</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/activity" className="w-full sm:w-auto">
          <Button variant="primary" size="md" leftIcon={<Activity size={16} />} className="w-full sm:w-auto">
            View in Activity
          </Button>
        </Link>

        <Link to="/" className="w-full sm:w-auto">
          <Button variant="outline" size="md" className="w-full sm:w-auto">
            Back to Home
          </Button>
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="md"
          leftIcon={<RotateCcw size={15} />}
          onClick={onReset}
          className="w-full sm:w-auto text-neutral-600"
        >
          New Request
        </Button>
      </div>
    </Card>
  );
};
