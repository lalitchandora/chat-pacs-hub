import { User, PACSConfiguration, ApiResponse, ChatRequest } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// Auth API
export const authAPI = {
  async login(username: string, password: string): Promise<{ user?: User; token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result: ApiResponse<{ user: User; access_token: string }> = await response.json();

      if (result.status === 'success' && result.data) {
        localStorage.setItem('auth_token', result.data.access_token);
        localStorage.setItem('current_user', JSON.stringify(result.data.user));
        return { user: result.data.user, token: result.data.access_token };
      }

      return { error: result.message || result.error?.details?.toString() || 'Login failed' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async signup(username: string, password: string): Promise<{ user?: User; token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result: ApiResponse<{ user: User; access_token: string }> = await response.json();

      if (result.status === 'success' && result.data) {
        localStorage.setItem('auth_token', result.data.access_token);
        localStorage.setItem('current_user', JSON.stringify(result.data.user));
        return { user: result.data.user, token: result.data.access_token };
      }

      return { error: result.message || result.error?.details?.toString() || 'Signup failed' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async me(): Promise<{ user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: authHeaders(),
      });

      const result: ApiResponse<User> = await response.json();

      if (result.status === 'success' && result.data) {
        localStorage.setItem('current_user', JSON.stringify(result.data));
        return { user: result.data };
      }

      return { error: result.message || 'Failed to get user info' };
    } catch (error) {
      return { error: 'Network error' };
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
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(request),
      });

      const result: ApiResponse<{ response: string }> = await response.json();

      if (result.status === 'success' && result.data) {
        return { response: result.data.response };
      }

      return { error: result.message || 'Failed to get response' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },
};

// PACS API
export const pacsAPI = {
  async getConfigurations(): Promise<{ configs?: PACSConfiguration[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pacs`, {
        method: 'GET',
        headers: authHeaders(),
      });

      const result: ApiResponse<PACSConfiguration[]> = await response.json();

      if (result.status === 'success' && result.data) {
        return { configs: result.data };
      }

      return { error: result.message || 'Failed to load configurations' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
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
      const response = await fetch(`${API_BASE_URL}/pacs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(config),
      });

      const result: ApiResponse<PACSConfiguration> = await response.json();

      if (result.status === 'success' && result.data) {
        return { config: result.data };
      }

      return { error: result.message || 'Failed to create configuration' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async updateConfiguration(id: string, updates: Partial<PACSConfiguration>): Promise<{ config?: PACSConfiguration; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pacs/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });

      const result: ApiResponse<PACSConfiguration> = await response.json();

      if (result.status === 'success' && result.data) {
        return { config: result.data };
      }

      return { error: result.message || 'Failed to update configuration' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async deleteConfiguration(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pacs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (result.status === 'success') {
        return { success: true };
      }

      return { success: false, error: result.message || 'Failed to delete configuration' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
};
