import { request } from './apiClient';
import type {
  ApiResponse,
  ReportRecord,
  CreateReportInput,
  BlockRecord,
  CreateBlockInput,
} from '@sevasetu/shared';

export const ReportService = {
  /**
   * Submits a report
   */
  async createReport(input: CreateReportInput): Promise<ReportRecord> {
    const res = await request<ApiResponse<ReportRecord>>('/reports', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.data) throw new Error(res.message || 'Failed to submit report');
    return res.data;
  },

  /**
   * Blocks a user
   */
  async createBlock(input: CreateBlockInput): Promise<BlockRecord> {
    const res = await request<ApiResponse<BlockRecord>>('/blocks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.data) throw new Error(res.message || 'Failed to block user');
    return res.data;
  },

  /**
   * Lists blocked users
   */
  async getBlockedUsers(): Promise<BlockRecord[]> {
    const res = await request<ApiResponse<BlockRecord[]>>('/blocks');
    return res.data || [];
  },

  /**
   * Unblocks a user
   */
  async deleteBlock(blockedUserId: string): Promise<boolean> {
    const res = await request<ApiResponse<{ success: boolean }>>(`/blocks/${blockedUserId}`, {
      method: 'DELETE',
    });
    return res.success;
  },
};
