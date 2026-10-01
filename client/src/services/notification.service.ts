import { request } from './apiClient';
import type {
  ApiResponse,
  NotificationRecord,
  NotificationPreferenceRecord,
  UpdateNotificationPreferenceInput,
} from '@sevasetu/shared';

export const NotificationService = {
  /**
   * Retrieves notifications and unread count
   */
  async getUserNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: NotificationRecord[];
    unreadCount: number;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const res = await request<
      ApiResponse<{
        notifications: NotificationRecord[];
        unreadCount: number;
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>
    >(`/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
    return (
      res.data || {
        notifications: [],
        unreadCount: 0,
        pagination: { total: 0, page: 1, limit, totalPages: 1 },
      }
    );
  },

  /**
   * Marks a notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationRecord> {
    const res = await request<ApiResponse<NotificationRecord>>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (!res.data) throw new Error(res.message || 'Failed to mark notification as read');
    return res.data;
  },

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const res = await request<ApiResponse<{ updatedCount: number }>>('/notifications/read-all', {
      method: 'POST',
    });
    return res.data || { updatedCount: 0 };
  },

  /**
   * Retrieves current unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await this.getUserNotifications(1, 1);
      return res.unreadCount;
    } catch {
      return 0;
    }
  },

  /**
   * Retrieves user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferenceRecord> {
    const res = await request<ApiResponse<NotificationPreferenceRecord>>('/notifications/preferences');
    if (!res.data) throw new Error('Preferences not found');
    return res.data;
  },

  /**
   * Updates user notification preferences
   */
  async updatePreferences(input: UpdateNotificationPreferenceInput): Promise<NotificationPreferenceRecord> {
    const res = await request<ApiResponse<NotificationPreferenceRecord>>('/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    if (!res.data) throw new Error(res.message || 'Failed to update preferences');
    return res.data;
  },
};
