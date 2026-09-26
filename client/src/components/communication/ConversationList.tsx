import React, { useState } from 'react';
import { Search, MessageSquare, User } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../../lib/utils';
import type { ConversationSummary } from '../../types';

export interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedId?: string;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  isLoading = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.otherPartyName.toLowerCase().includes(q) ||
      c.serviceTitle.toLowerCase().includes(q) ||
      (c.bookingReference && c.bookingReference.toLowerCase().includes(q))
    );
  });

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-neutral-200', className)}>
      {/* Search Header */}
      <div className="p-3 border-b border-neutral-200 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, names, bookings..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
            aria-label="Filter conversations"
          />
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 scrollbar-thin">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="h-14 rounded-lg bg-neutral-100 animate-pulse" />
            <div className="h-14 rounded-lg bg-neutral-100 animate-pulse" />
            <div className="h-14 rounded-lg bg-neutral-100 animate-pulse" />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectConversation(item.id)}
                className={cn(
                  'w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  isSelected
                    ? 'bg-neutral-900/5 border-l-3 border-neutral-900'
                    : 'hover:bg-neutral-50'
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 text-xs">
                    {item.otherPartyAvatar ? (
                      <img
                        src={item.otherPartyAvatar}
                        alt={item.otherPartyName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  {item.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-neutral-900 truncate">
                      {item.otherPartyName}
                    </span>
                    {item.lastMessageTime && (
                      <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                        {item.lastMessageTime}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1">
                    <span className="truncate">{item.serviceTitle}</span>
                    {item.bookingReference && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        • #{item.bookingReference}
                      </span>
                    )}
                  </div>

                  {item.lastMessage && (
                    <p className="text-xs text-neutral-600 truncate">
                      {item.lastMessage}
                    </p>
                  )}
                </div>

                {/* Unread Counter Badge */}
                {item.unreadCount > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="p-6 text-center">
            <EmptyState
              icon={<MessageSquare size={20} />}
              title="No active conversations"
              description="Direct customer and service technician messaging will initiate once service bookings are placed or assigned."
            />
          </div>
        )}
      </div>
    </div>
  );
};
