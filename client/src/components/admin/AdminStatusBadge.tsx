import React from 'react';
import { Badge } from '../ui/Badge';
import type {
  AdminAccountStatus,
  VerificationState,
  DisputeStatus,
  DisputePriority,
  SupportTicketStatus,
  TrustSafetyState,
} from '../../types/admin';
import type { VerificationStatus } from '../../types/provider';

// Account Status Badge
export const AccountStatusBadge: React.FC<{ status: AdminAccountStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  switch (status) {
    case 'active':
      return <Badge variant="success" size={size}>Active</Badge>;
    case 'inactive':
      return <Badge variant="neutral" size={size}>Inactive</Badge>;
    case 'restricted':
      return <Badge variant="warning" size={size}>Restricted</Badge>;
    case 'suspended':
      return <Badge variant="error" size={size}>Suspended</Badge>;
    case 'under_review':
      return <Badge variant="info" size={size}>Under Review</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};

// Verification Status Badge
export const VerificationStatusBadge: React.FC<{
  status: VerificationState | VerificationStatus;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'approved':
    case 'verified':
      return <Badge variant="success" size={size}>Verified</Badge>;
    case 'under_review':
    case 'pending':
      return <Badge variant="info" size={size}>Under Review</Badge>;
    case 'submitted':
      return <Badge variant="info" size={size}>Submitted</Badge>;
    case 'needs_information':
      return <Badge variant="warning" size={size}>Needs Info</Badge>;
    case 'rejected':
      return <Badge variant="error" size={size}>Rejected</Badge>;
    case 'unverified':
    case 'not_submitted':
    default:
      return <Badge variant="neutral" size={size}>Not Submitted</Badge>;
  }
};

// Dispute Status Badge
export const DisputeStatusBadge: React.FC<{ status: DisputeStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  switch (status) {
    case 'open':
      return <Badge variant="error" size={size}>Open</Badge>;
    case 'under_review':
      return <Badge variant="info" size={size}>Under Review</Badge>;
    case 'waiting_for_info':
      return <Badge variant="warning" size={size}>Waiting Info</Badge>;
    case 'resolved':
      return <Badge variant="success" size={size}>Resolved</Badge>;
    case 'closed':
      return <Badge variant="neutral" size={size}>Closed</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};

// Dispute Priority Badge
export const DisputePriorityBadge: React.FC<{ priority: DisputePriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  switch (priority) {
    case 'urgent':
      return <Badge variant="error" size={size}>Urgent</Badge>;
    case 'high':
      return <Badge variant="warning" size={size}>High</Badge>;
    case 'medium':
      return <Badge variant="info" size={size}>Medium</Badge>;
    case 'low':
      return <Badge variant="neutral" size={size}>Low</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{priority}</Badge>;
  }
};

// Support Ticket Status Badge
export const SupportStatusBadge: React.FC<{ status: SupportTicketStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  switch (status) {
    case 'open':
      return <Badge variant="error" size={size}>Open</Badge>;
    case 'pending':
      return <Badge variant="warning" size={size}>Pending</Badge>;
    case 'resolved':
      return <Badge variant="success" size={size}>Resolved</Badge>;
    case 'closed':
      return <Badge variant="neutral" size={size}>Closed</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};

// Trust & Safety Case Badge
export const TrustSafetyBadge: React.FC<{ status: TrustSafetyState; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  switch (status) {
    case 'flagged':
      return <Badge variant="error" size={size}>Flagged</Badge>;
    case 'under_review':
      return <Badge variant="info" size={size}>In Review</Badge>;
    case 'cleared':
      return <Badge variant="success" size={size}>Cleared</Badge>;
    case 'restricted':
      return <Badge variant="warning" size={size}>Restricted</Badge>;
    case 'escalated':
      return <Badge variant="error" size={size}>Escalated</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};
