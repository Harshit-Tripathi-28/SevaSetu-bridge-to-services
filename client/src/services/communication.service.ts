import { io, Socket } from 'socket.io-client';
import { request } from './apiClient';
import type {
  ApiResponse,
  ConversationRecord,
  MessageRecord,
} from '@sevasetu/shared';

let socketInstance: Socket | null = null;

const SOCKET_SERVER_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000'
).replace(/\/api\/?$/, '');

export const CommunicationService = {
  /**
   * Initializes or returns the authenticated Socket.IO client instance
   */
  getSocket(): Socket {
    if (!socketInstance) {
      socketInstance = io(SOCKET_SERVER_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
    }
    return socketInstance;
  },

  /**
   * Disconnects socket connection
   */
  disconnectSocket() {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  },

  /**
   * Retrieves or creates a conversation for a specific booking
   */
  async getBookingConversation(bookingId: string): Promise<ConversationRecord> {
    const res = await request<ApiResponse<ConversationRecord>>(`/bookings/${bookingId}/conversation`);
    if (!res.data) throw new Error(res.message || 'Failed to load booking conversation');
    return res.data;
  },

  /**
   * Retrieves all conversations for the authenticated user
   */
  async getUserConversations(): Promise<ConversationRecord[]> {
    const res = await request<ApiResponse<ConversationRecord[]>>('/conversations');
    return res.data || [];
  },

  /**
   * Retrieves messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: MessageRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await request<ApiResponse<{ messages: MessageRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>>(
      `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return res.data || { messages: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } };
  },

  /**
   * Sends a message into a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<MessageRecord> {
    const res = await request<ApiResponse<MessageRecord>>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!res.data) throw new Error(res.message || 'Failed to send message');
    return res.data;
  },

  /**
   * Subscribes to real-time notification events
   */
  onNotification(callback: (notification: unknown) => void): () => void {
    const socket = this.getSocket();
    socket.on('new_notification', callback);
    return () => {
      socket.off('new_notification', callback);
    };
  },
};
