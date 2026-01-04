import { User, PACSConfiguration, ApiResponse, ChatRequest } from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 20000;

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const authHeaders = (): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const isAbortError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'AbortError';
};

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(id);
  }
};

const safeReadJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Non-JSON response (proxy/tunnel errors often return HTML/text)
    return {
      status: 'error',
      message: text,
      data: null,
      error: { code: 'NON_JSON_RESPONSE', details: null },
    } satisfies ApiResponse;
  }
};

const buildUrl = (path: string): string => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const requestApi = async <T>(
  path: string,
  init: RequestInit
): Promise<unknown> => {
  const response = await fetchWithTimeout(buildUrl(path), init);
  return safeReadJson(response);
};

// Helper to extract error message from API response
const getErrorMessage = (payload: unknown): string => {
  const p = payload as any;

  // Our ApiResponse error format
  if (Array.isArray(p?.error?.details)) {
    const msgs = p.error.details
      .map((d: any) => d?.msg)
      .filter(Boolean);
    return msgs.join(', ') || p?.message || 'An error occurred';
  }

  // FastAPI HTTPValidationError format
  if (Array.isArray(p?.detail)) {
    const msgs = p.detail
      .map((d: any) => d?.msg)
      .filter(Boolean);
    return msgs.join(', ') || 'Validation failed';
  }

  return p?.message || 'An error occurred';
};

const networkErrorMessage = (error: unknown): string => {
  return isAbortError(error) ? 'Request timed out. Please try again.' : 'Network error. Please try again.';
};

// Auth API
export const authAPI = {
  async login(username: string, password: string): Promise<{ token?: string; error?: string }> {
    try {
      const payload = await requestApi<{ access_token: string; token_type: string }>(
        '/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const result = payload as ApiResponse<{ access_token: string; token_type: string }>;

      if (result?.status === 'success' && result?.data?.access_token) {
        localStorage.setItem('auth_token', result.data.access_token);
        return { token: result.data.access_token };
      }

      return { error: getErrorMessage(payload) };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  async signup(username: string, password: string): Promise<{ user?: User; error?: string }> {
    try {
      const payload = await requestApi<{ id: string; username: string; pac_ids: string[] }>(
        '/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const result = payload as ApiResponse<{ id: string; username: string; pac_ids: string[] }>;

      if (result?.status === 'success' && result?.data?.id && result?.data?.username) {
        const user: User = {
          id: result.data.id,
          username: result.data.username,
        };
        return { user };
      }

      return { error: getErrorMessage(payload) };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  async me(): Promise<{ user?: User; error?: string }> {
    try {
      const payload = await requestApi<User>('/auth/me', {
        method: 'GET',
        headers: authHeaders(),
      });

      const result = payload as ApiResponse<User>;

      if (result?.status === 'success' && result?.data) {
        localStorage.setItem('current_user', JSON.stringify(result.data));
        return { user: result.data };
      }

      return { error: getErrorMessage(payload) || 'Failed to get user info' };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  logout() {
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
  },
};

// Chat API
export const chatAPI = {
  async sendMessage(request: ChatRequest): Promise<{ response?: string; error?: string }> {
    try {
      const payload = await requestApi<{ response: string }>('/agent/chat', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(request),
      });

      const result = payload as ApiResponse<{ response: string }>;

      if (result?.status === 'success' && result?.data?.response) {
        return { response: result.data.response };
      }

      return { error: getErrorMessage(payload) || 'Failed to get response' };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },
};

// PACS API
export const pacsAPI = {
  async getConfigurations(): Promise<{ configs?: PACSConfiguration[]; error?: string }> {
    try {
      const payload = await requestApi<PACSConfiguration[]>('/pacs', {
        method: 'GET',
        headers: authHeaders(),
      });

      const result = payload as ApiResponse<PACSConfiguration[]>;

      if (result?.status === 'success' && result?.data) {
        return { configs: result.data };
      }

      return { error: getErrorMessage(payload) || 'Failed to load configurations' };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  async createConfiguration(config: {
    display_name: string;
    base_rs: string;
    location?: string;
    headers?: Record<string, string>;
    auth?: Record<string, string>;
    tags: string[];
  }): Promise<{ config?: PACSConfiguration; error?: string }> {
    try {
      const payload = await requestApi<PACSConfiguration>('/pacs', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(config),
      });

      const result = payload as ApiResponse<PACSConfiguration>;

      if (result?.status === 'success' && result?.data) {
        return { config: result.data };
      }

      return { error: getErrorMessage(payload) || 'Failed to create configuration' };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  async updateConfiguration(
    id: string,
    updates: Partial<PACSConfiguration>
  ): Promise<{ config?: PACSConfiguration; error?: string }> {
    try {
      const payload = await requestApi<PACSConfiguration>(`/pacs/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });

      const result = payload as ApiResponse<PACSConfiguration>;

      if (result?.status === 'success' && result?.data) {
        return { config: result.data };
      }

      return { error: getErrorMessage(payload) || 'Failed to update configuration' };
    } catch (error) {
      return { error: networkErrorMessage(error) };
    }
  },

  async deleteConfiguration(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = await requestApi<unknown>(`/pacs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const result = payload as ApiResponse;

      if (result?.status === 'success') {
        return { success: true };
      }

      return { success: false, error: getErrorMessage(payload) || 'Failed to delete configuration' };
    } catch (error) {
      return { success: false, error: networkErrorMessage(error) };
    }
  },
};
