import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import type { MessageItem } from '../../types';
import { cn } from '../../lib/utils';

export interface MessageBubbleProps {
  message: MessageItem;
  isSelf: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  className,
}) => {
  const isSystem = message.senderRole === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-600 font-medium max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col mb-3',
        isSelf ? 'items-end' : 'items-start',
        className
      )}
    >
      {/* Sender Name (shown when not self) */}
      {!isSelf && (
        <span className="text-[11px] text-neutral-500 font-medium mb-1 ml-1">
          {message.senderName}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          'relative max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-2xs leading-relaxed',
          isSelf
            ? 'bg-neutral-900 text-white rounded-tr-xs'
            : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-xs'
        )}
      >
        {/* Attachment preview if present */}
        {message.attachment && (
          <div
            className={cn(
              'mb-2 p-2 rounded-lg flex items-center gap-2 border text-xs',
              isSelf
                ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            )}
          >
            {message.attachment.type === 'image' ? (
              <ImageIcon size={16} className="text-primary-400 shrink-0" />
            ) : (
              <FileText size={16} className="text-primary-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="truncate block font-medium">{message.attachment.name}</span>
              {message.attachment.sizeFormatted && (
                <span className="text-[10px] text-neutral-400 block font-mono">
                  {message.attachment.sizeFormatted}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Message Content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp and Status Meta */}
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1 text-[10px] font-mono',
            isSelf ? 'text-neutral-400' : 'text-neutral-400'
          )}
        >
          <span>{message.timestamp}</span>
          {isSelf && <MessageStatusIndicator status={message.status} />}
        </div>
      </div>
    </div>
  );
};
