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
    conversationId || 'conv-101'
  );
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(!conversationId);

  // Data-driven conversations list (authentic customer ↔ provider thread)
  const [conversations, setConversations] = useState<ConversationSummary[]>([
    {
      id: 'conv-101',
      otherPartyId: userRole === 'customer' ? 'prov-101' : 'cust-202',
      otherPartyName:
        userRole === 'customer'
          ? 'Ramesh Sharma (Electrician)'
          : 'Priya Sharma (Client)',
      otherPartyRole: userRole === 'customer' ? 'provider' : 'customer',
      serviceTitle: 'Electrical Fixture & Switchboard Repair',
      lastMessage: 'I have arrived at the society main gate.',
      lastMessageTime: '10:15 AM',
      unreadCount: 1,
      bookingReference: 'REQ-847291',
      bookingStatus: 'in_progress',
      isOnline: true,
    },
    {
      id: 'conv-102',
      otherPartyId: userRole === 'customer' ? 'prov-102' : 'cust-203',
      otherPartyName:
        userRole === 'customer'
          ? 'Suresh Kumar (Plumber)'
          : 'Anand Verma (Client)',
      otherPartyRole: userRole === 'customer' ? 'provider' : 'customer',
      serviceTitle: 'Bathroom Tap Leakage & Valve Repair',
      lastMessage: 'Will carry the half-inch brass connector.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      bookingReference: 'REQ-847110',
      bookingStatus: 'scheduled',
      isOnline: false,
    },
  ]);

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

  // Active messages thread
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({
    'conv-101': [
      {
        id: 'msg-1',
        conversationId: 'conv-101',
        senderId: 'system',
        senderRole: 'system',
        senderName: 'SevaSetu System',
        content:
          'Service Booking #REQ-847291 confirmed. Use this thread for arrival coordination and location details.',
        timestamp: '09:00 AM',
        status: 'read',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-101',
        senderId: userRole === 'customer' ? 'prov-101' : 'self',
        senderRole: 'provider',
        senderName: 'Ramesh Sharma',
        content:
          'Namaste! I am on the way to Sector 14 with necessary switchboard spares.',
        timestamp: '09:45 AM',
        status: 'read',
      },
      {
        id: 'msg-3',
        conversationId: 'conv-101',
        senderId: userRole === 'customer' ? 'self' : 'cust-202',
        senderRole: 'customer',
        senderName: 'Priya Sharma',
        content:
          'Great, please inform the security guard at Gate 2 for tower C entry.',
        timestamp: '09:48 AM',
        status: 'read',
      },
      {
        id: 'msg-4',
        conversationId: 'conv-101',
        senderId: userRole === 'customer' ? 'prov-101' : 'self',
        senderRole: 'provider',
        senderName: 'Ramesh Sharma',
        content: 'I have arrived at the society main gate.',
        timestamp: '10:15 AM',
        status: 'delivered',
      },
    ],
    'conv-102': [
      {
        id: 'msg-102-1',
        conversationId: 'conv-102',
        senderId: 'system',
        senderRole: 'system',
        senderName: 'SevaSetu System',
        content: 'Service Booking #REQ-847110 scheduled for tomorrow.',
        timestamp: 'Yesterday',
        status: 'read',
      },
      {
        id: 'msg-102-2',
        conversationId: 'conv-102',
        senderId: userRole === 'customer' ? 'prov-102' : 'self',
        senderRole: 'provider',
        senderName: 'Suresh Kumar',
        content: 'Will carry the half-inch brass connector.',
        timestamp: 'Yesterday',
        status: 'read',
      },
    ],
  });

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
    if (!content.trim() && !attachmentName) return;

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
