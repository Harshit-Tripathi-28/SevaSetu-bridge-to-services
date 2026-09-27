import { apiClient } from './apiClient';
import type {
  ApiResponse,
  AuthUser,
  RegisterRequest,
  LoginRequest,
} from '@sevasetu/shared';

export const authService = {
  /**
   * Registers a new user account.
   */
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/register', data),

  /**
   * Logs in a user using credentials and receives HTTP-only session cookie.
   */
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/login', data),

  /**
   * Clears the server-side authentication session and cookie.
   */
  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  /**
   * Fetches current authenticated user context from server.
   */
  getCurrentUser: () =>
    apiClient.get<ApiResponse<{ user: AuthUser }>>('/auth/me'),
};
