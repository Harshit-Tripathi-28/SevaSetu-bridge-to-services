import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import {
  ConversationList,
  ConversationView,
} from '../../components/communication';
import { SupportEntry } from '../../components/transaction';
import type {
  ConversationSummary,
  ConversationContextData,
  MessageItem,
} from '../../types';

export interface MessagesPageProps {
  userRole?: 'customer' | 'provider';
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  userRole = 'customer',
}) => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string>(
    conversationId || ''
  );
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(!conversationId);

  // Data-driven conversations list (empty initial state per data integrity audit)
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  // Context metadata for current conversation
  const activeConversation = conversations.find((c) => c.id === selectedId);

  const contextData: ConversationContextData | undefined = activeConversation
    ? {
        bookingId: activeConversation.bookingReference,
        serviceTitle: activeConversation.serviceTitle,
        scheduledDate: '26 Sep 2026, 10:30 AM',
        statusLabel: 'In Progress',
        locationSummary: 'Flat 402, Green Valley Enclave, Sector 14',
      }
    : undefined;

  // Active messages thread (empty initial state per data integrity audit)
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setIsMobileListOpen(false);

    // Clear unread badge
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );

    // Update URL without full reload
    navigate(
      userRole === 'provider'
        ? `/provider/messages/${id}`
        : `/messages/${id}`,
      { replace: true }
    );
  };

  const handleSendMessage = (content: string, attachmentName?: string) => {
    if (!selectedId || (!content.trim() && !attachmentName)) return;

    const newMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      conversationId: selectedId,
      senderId: 'self',
      senderRole: userRole,
      senderName: userRole === 'customer' ? 'You (Client)' : 'You (Partner)',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'sent',
      attachment: attachmentName
        ? {
            name: attachmentName,
            type: attachmentName.endsWith('.pdf') ? 'document' : 'image',
            sizeFormatted: '1.2 MB',
          }
        : undefined,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMessage],
    }));

    // Update conversation snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: content.trim() || `[Attachment: ${attachmentName}]`,
              lastMessageTime: 'Just now',
            }
          : c
      )
    );
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-4 pb-8 h-[calc(100vh-5rem)] flex flex-col">
      <div className="shrink-0">
        <PageHeader
          title="Direct Service Messages"
          description={
            userRole === 'provider'
              ? 'Coordinate arrival, directions, and on-site task clarifications with your clients.'
              : 'Direct communication with your assigned local service professionals.'
          }
          breadcrumbs={[
            {
              label: userRole === 'provider' ? 'Provider Console' : 'Activity',
              href: userRole === 'provider' ? '/provider' : '/activity',
            },
            { label: 'Messages' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LifeBuoy size={14} />}
              onClick={() => setIsSupportOpen(true)}
              className="text-xs h-8"
            >
              Support &amp; Safety
            </Button>
          }
        />
      </div>

      {/* Main Messaging Layout Box */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs flex">
        {/* Mobile toggle button if on thread */}
        {!isMobileListOpen && (
          <div className="md:hidden fixed bottom-20 left-4 z-20">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => setIsMobileListOpen(true)}
              className="shadow-md text-xs font-semibold"
            >
              Conversations
            </Button>
          </div>
        )}

        {/* Left Column: Conversation List */}
        <div
          className={`${
            isMobileListOpen ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 flex-col shrink-0 border-r border-neutral-200`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Right Column: Active Conversation View */}
        <div
          className={`${
            !isMobileListOpen ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col min-w-0`}
        >
          <ConversationView
            conversation={activeConversation}
            context={contextData}
            messages={messages[selectedId] || []}
            currentUserId="self"
            onSendMessage={handleSendMessage}
            onOpenSupport={() => setIsSupportOpen(true)}
          />
        </div>
      </div>

      {/* Support Entry Modal */}
      <SupportEntry
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultTopic="communication"
        bookingReference={activeConversation?.bookingReference}
      />
    </PageContainer>
  );
};
