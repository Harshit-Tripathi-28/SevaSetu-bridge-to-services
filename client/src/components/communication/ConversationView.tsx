import React, { useRef, useEffect } from 'react';
import {
  User,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ConversationContext } from './ConversationContext';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import type {
  ConversationSummary,
  ConversationContextData,
  MessageItem,
} from '../../types';

export interface ConversationViewProps {
  conversation?: ConversationSummary;
  context?: ConversationContextData;
  messages: MessageItem[];
  currentUserId: string;
  onSendMessage: (text: string, attachmentName?: string) => void;
  onOpenSupport?: () => void;
  isLoading?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  context,
  messages,
  currentUserId,
  onSendMessage,
  onOpenSupport,
  isLoading = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50/50 text-center">
        <div className="max-w-sm space-y-3 text-neutral-500">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <MessageSquare size={24} />
          </div>
          <h3 className="font-semibold text-neutral-800 text-sm">
            Select a conversation
          </h3>
          <p className="text-xs leading-relaxed">
            Choose an ongoing customer service booking thread from the list to exchange messages, coordination details, and on-site updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/30 overflow-hidden">
      {/* Conversation Top Header */}
      <div className="p-3.5 sm:p-4 bg-white border-b border-neutral-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-xs shrink-0">
            {conversation.otherPartyAvatar ? (
              <img
                src={conversation.otherPartyAvatar}
                alt={conversation.otherPartyName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={16} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-neutral-900 truncate">
                {conversation.otherPartyName}
              </h3>
              <Badge variant="neutral" size="sm" className="text-[10px] uppercase py-0 px-1 font-semibold">
                {conversation.otherPartyRole}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500 truncate">
              {conversation.serviceTitle}
            </p>
          </div>
        </div>

        {/* Action Pathway (Support / Guidance) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenSupport && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LifeBuoy size={13} />}
              onClick={onOpenSupport}
              className="text-xs h-8 hidden sm:inline-flex"
            >
              Help &amp; Safety
            </Button>
          )}
        </div>
      </div>

      {/* Pinned Service / Booking Context Bar */}
      {context && <ConversationContext context={context} />}

      {/* Message Timeline Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 scrollbar-thin"
      >
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-3/4 h-12 bg-neutral-200/60 rounded-xl animate-pulse" />
            <div className="w-2/3 h-12 bg-neutral-200/60 rounded-xl animate-pulse ml-auto" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === currentUserId}
            />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
            <p className="font-medium text-neutral-600">Start of conversation</p>
            <p>Direct coordination messages between customer and service technician appear here.</p>
          </div>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer onSendMessage={onSendMessage} />
    </div>
  );
};
