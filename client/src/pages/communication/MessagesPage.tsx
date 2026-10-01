import React, { useState, useEffect, useCallback } from 'react';
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
import { CommunicationService } from '../../services/communication.service';
import { useAuth } from '../../context/AuthContext';
import type {
  ConversationSummary,
  ConversationContextData,
  MessageItem,
} from '../../types';
import type { ConversationRecord, MessageRecord } from '@sevasetu/shared';

export interface MessagesPageProps {
  userRole?: 'customer' | 'provider';
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  userRole = 'customer',
}) => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [selectedId, setSelectedId] = useState<string>(conversationId || '');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(!conversationId);

  // Raw conversations from backend
  const [rawConversations, setRawConversations] = useState<ConversationRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await CommunicationService.getUserConversations();
      setRawConversations(list);

      const summaries: ConversationSummary[] = list.map((c) => {
        const otherUserId = userRole === 'customer' ? c.provider.userId : c.customer.userId;
        const otherParticipant =
          userRole === 'customer' ? c.provider.fullName : c.customer.fullName;
        const otherRole: 'customer' | 'provider' = userRole === 'customer' ? 'provider' : 'customer';
        const otherAvatar =
          userRole === 'customer' ? c.provider.avatarUrl || undefined : undefined;

        let lastTime = 'Recently';
        if (c.lastMessage) {
          try {
            lastTime = new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
          } catch {
            lastTime = 'Recently';
          }
        }

        return {
          id: c.id,
          otherPartyId: otherUserId,
          otherPartyName: otherParticipant,
          otherPartyRole: otherRole,
          otherPartyAvatar: otherAvatar,
          bookingReference: c.bookingReferenceCode,
          serviceTitle: c.serviceTitle,
          lastMessage: c.lastMessage?.content || 'Conversation started',
          lastMessageTime: lastTime,
          unreadCount: c.unreadCount || 0,
          isOnline: true,
        };
      });

      setConversations(summaries);

      // Select first conversation if none selected
      if (!selectedId && summaries.length > 0 && summaries[0]) {
        setSelectedId(summaries[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [selectedId, userRole]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await CommunicationService.getConversationMessages(id);
      const mapped: MessageItem[] = res.messages.map((m) => {
        const r = m.senderRole?.toLowerCase();
        const role: 'customer' | 'provider' | 'system' =
          r === 'provider' ? 'provider' : r === 'admin' || r === 'system' ? 'system' : 'customer';

        return {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderUserId === authUser?.id ? 'self' : m.senderUserId,
          senderRole: role,
          senderName: m.senderName || (m.senderUserId === authUser?.id ? 'You' : 'Participant'),
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: m.readAt ? 'read' : 'sent',
        };
      });

      setMessages((prev) => ({ ...prev, [id]: mapped }));

      // Join socket room
      const socket = CommunicationService.getSocket();
      socket.emit('join_conversation', { conversationId: id });
    } catch (err) {
      console.error('Failed to load messages for conversation:', id, err);
    }
  }, [authUser?.id]);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  // Listen for real-time WebSocket messages
  useEffect(() => {
    const socket = CommunicationService.getSocket();

    const handleNewMessage = (msg: MessageRecord) => {
      const r = msg.senderRole?.toLowerCase();
      const role: 'customer' | 'provider' | 'system' =
        r === 'provider' ? 'provider' : r === 'admin' || r === 'system' ? 'system' : 'customer';

      const item: MessageItem = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderUserId === authUser?.id ? 'self' : msg.senderUserId,
        senderRole: role,
        senderName: msg.senderName || (msg.senderUserId === authUser?.id ? 'You' : 'Participant'),
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'sent',
      };

      setMessages((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), item],
      }));

      // Update snippet on conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageTime: 'Just now',
                unreadCount: msg.senderUserId === authUser?.id ? c.unreadCount : c.unreadCount + 1,
              }
            : c
        )
      );
    };

    socket.on('conversation:message', handleNewMessage);

    return () => {
      socket.off('conversation:message', handleNewMessage);
    };
  }, [authUser?.id]);

  const activeRaw = rawConversations.find((c) => c.id === selectedId);
  const activeConversation = conversations.find((c) => c.id === selectedId);

  const contextData: ConversationContextData | undefined = activeRaw
    ? {
        bookingId: activeRaw.bookingReferenceCode,
        serviceTitle: activeRaw.serviceTitle,
        scheduledDate: new Date(activeRaw.createdAt).toLocaleDateString(),
        statusLabel: activeRaw.bookingStatus,
        locationSummary: 'Authorized service address on file',
      }
    : undefined;

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

  const handleSendMessage = async (content: string) => {
    if (!selectedId || !content.trim()) return;

    try {
      const msg = await CommunicationService.sendMessage(selectedId, content.trim());

      const newMessage: MessageItem = {
        id: msg.id,
        conversationId: selectedId,
        senderId: 'self',
        senderRole: userRole,
        senderName: 'You',
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'sent',
      };

      setMessages((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), newMessage],
      }));

      // Update conversation list snippet
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                lastMessage: msg.content,
                lastMessageTime: 'Just now',
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
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
            isLoading={isLoadingConversations}
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
