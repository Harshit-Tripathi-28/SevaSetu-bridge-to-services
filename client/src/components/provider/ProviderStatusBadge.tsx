import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  MapPin,
  PlayCircle,
  CheckCheck,
  ShieldCheck,
  FileEdit,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import type {
  ProviderRequestStatus,
  ProviderJobStatus,
  ProviderProfileStatus,
} from '../../types';

// ==========================================
// 1. Request Status Badge
// ==========================================
export interface RequestStatusBadgeProps {
  status: ProviderRequestStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  switch (status) {
    case 'new':
      return (
        <Badge variant="info" size={size} withDot className={className}>
          <Sparkles size={11} className="mr-1 inline-block" />
          <span>New Request</span>
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="warning" size={size} withDot className={className}>
          <Clock size={11} className="mr-1 inline-block" />
          <span>Pending Review</span>
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="success" size={size} withDot className={className}>
          <CheckCircle2 size={11} className="mr-1 inline-block" />
          <span>Accepted</span>
        </Badge>
      );
    case 'declined':
      return (
        <Badge variant="error" size={size} withDot className={className}>
          <XCircle size={11} className="mr-1 inline-block" />
          <span>Declined</span>
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <AlertCircle size={11} className="mr-1 inline-block" />
          <span>Expired</span>
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <XCircle size={11} className="mr-1 inline-block" />
          <span>Cancelled</span>
        </Badge>
      );
  }
};

// ==========================================
// 2. Job Status Badge
// ==========================================
export interface JobStatusBadgeProps {
  status: ProviderJobStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant="info" size={size} withDot className={className}>
          <Clock size={11} className="mr-1 inline-block" />
          <span>Scheduled</span>
        </Badge>
      );
    case 'on_the_way':
      return (
        <Badge variant="warning" size={size} withDot className={className}>
          <Truck size={11} className="mr-1 inline-block" />
          <span>On the Way</span>
        </Badge>
      );
    case 'arrived':
      return (
        <Badge variant="info" size={size} withDot className={className}>
          <MapPin size={11} className="mr-1 inline-block" />
          <span>Arrived on Site</span>
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="info" size={size} withDot className={className}>
          <PlayCircle size={11} className="mr-1 inline-block" />
          <span>In Progress</span>
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="success" size={size} withDot className={className}>
          <CheckCheck size={11} className="mr-1 inline-block" />
          <span>Completed</span>
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <XCircle size={11} className="mr-1 inline-block" />
          <span>Cancelled</span>
        </Badge>
      );
  }
};

// ==========================================
// 3. Profile Status Badge
// ==========================================
export interface ProfileStatusBadgeProps {
  status: ProviderProfileStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const ProfileStatusBadge: React.FC<ProfileStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="success" size={size} withDot className={className}>
          <ShieldCheck size={11} className="mr-1 inline-block" />
          <span>Verified Partner</span>
        </Badge>
      );
    case 'active':
      return (
        <Badge variant="info" size={size} withDot className={className}>
          <CheckCircle2 size={11} className="mr-1 inline-block" />
          <span>Active</span>
        </Badge>
      );
    case 'under_review':
      return (
        <Badge variant="warning" size={size} withDot className={className}>
          <Clock size={11} className="mr-1 inline-block" />
          <span>Under Review</span>
        </Badge>
      );
    case 'incomplete':
      return (
        <Badge variant="error" size={size} withDot className={className}>
          <AlertCircle size={11} className="mr-1 inline-block" />
          <span>Profile Incomplete</span>
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <FileEdit size={11} className="mr-1 inline-block" />
          <span>Draft</span>
        </Badge>
      );
  }
};
