import React from 'react';
import { Clock, Check, CheckCheck, AlertCircle } from 'lucide-react';
import type { MessageStatus } from '../../types';

export interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'sending':
      return (
        <span title="Sending message..." className={className} aria-label="Sending message">
          <Clock size={12} className="text-neutral-400 animate-pulse" />
        </span>
      );
    case 'sent':
      return (
        <span title="Sent to server" className={className} aria-label="Message sent">
          <Check size={12} className="text-neutral-400" />
        </span>
      );
    case 'delivered':
      return (
        <span title="Delivered to recipient" className={className} aria-label="Message delivered">
          <CheckCheck size={12} className="text-neutral-400" />
        </span>
      );
    case 'read':
      return (
        <span title="Read by recipient" className={className} aria-label="Message read">
          <CheckCheck size={12} className="text-primary-600" />
        </span>
      );
    case 'failed':
      return (
        <span title="Message failed to send" className={className} aria-label="Message delivery failed">
          <AlertCircle size={12} className="text-rose-600" />
        </span>
      );
    default:
      return null;
  }
};
