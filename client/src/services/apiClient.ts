/**
 * Core API Client for SevaSetu Frontend.
 * Centralizes HTTP requests, base URL configuration, headers, and error handling.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMsg, response.status, data?.error?.code, data?.error?.details);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or server offline
    const failureMessage =
      error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(
      `Cannot connect to backend server at ${url}. ${failureMessage}`,
      0,
      'NETWORK_CONNECTION_ERROR'
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  getBaseUrl: () => API_BASE_URL,
};
