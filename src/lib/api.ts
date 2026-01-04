import { User, PACSConfiguration, ApiResponse, ChatRequest, ChatMessage } from '@/types';

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
  async login(username: string, password: string): Promise<{ token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Handle validation errors (422) - different response format
      if (response.status === 422) {
        const errorData = await response.json();
        const messages = errorData.detail?.map((d: any) => d.msg).filter(Boolean) || [];
        return { error: messages.join(', ') || 'Validation error' };
      }

      const result: ApiResponse<any> = await response.json();

      if (response.ok && result.status === 'success' && result.data) {
        // Handle different possible response structures
        // Could be: { access_token: string } or { token: string } or just a string
        let token: string | null = null;
        
        if (typeof result.data === 'string') {
          token = result.data;
        } else if (result.data.access_token) {
          token = result.data.access_token;
        } else if (result.data.token) {
          token = result.data.token;
        }

        if (token) {
          localStorage.setItem('auth_token', token);
          return { token };
        }
      }

      // Handle error responses
      return { error: result.message || (typeof result.error?.details === 'string' ? result.error.details : result.error?.details?.toString()) || 'Login failed' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async signup(username: string, password: string): Promise<{ token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Handle validation errors (422) - different response format
      if (response.status === 422) {
        const errorData = await response.json();
        const messages = errorData.detail?.map((d: any) => d.msg).filter(Boolean) || [];
        return { error: messages.join(', ') || 'Validation error' };
      }

      const result: ApiResponse<any> = await response.json();

      if (response.ok && result.status === 'success' && result.data) {
        // Handle different possible response structures
        let token: string | null = null;
        
        if (typeof result.data === 'string') {
          token = result.data;
        } else if (result.data.access_token) {
          token = result.data.access_token;
        } else if (result.data.token) {
          token = result.data.token;
        }

        if (token) {
          localStorage.setItem('auth_token', token);
          return { token };
        }
      }

      // Handle error responses
      return { error: result.message || (typeof result.error?.details === 'string' ? result.error.details : result.error?.details?.toString()) || 'Signup failed' };
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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to get user info' };
      }

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
  async getAllChats(): Promise<{ chats?: ChatMessage[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/chats`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authAPI.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to load chats' };
      }

      const result: ApiResponse<{messages: ChatMessage[]}> = await response.json();
      console.log(result, ' get all chats result');
      if (result.status === 'success' && result.data) {
        // Ensure data is an array
        const chats = Array.isArray(result.data.messages) ? result.data.messages : [];
        console.log(chats, ' chats');
        return { chats };
      }

      return { error: result.message || 'Failed to load chats' };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  },

  async sendMessage(request: ChatRequest): Promise<{ response?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // authAPI.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        if (response.status === 422) {
          const errorData = await response.json();
          const messages = errorData.detail?.map((d: any) => d.msg).filter(Boolean) || [];
          return { error: messages.join(', ') || 'Validation error' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to get response' };
      }

      const result: ApiResponse<{ llm: string }> = await response.json();
      if (result.status === 'success' && result.data) {
        return { response: result.data.llm };
      }

      return { error: result.error?.details?.toString() || 'Failed to get response' };
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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authAPI.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to load configurations' };
      }

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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authAPI.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        if (response.status === 422) {
          const errorData = await response.json();
          const messages = errorData.detail?.map((d: any) => d.msg).filter(Boolean) || [];
          return { error: messages.join(', ') || 'Validation error' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to create configuration' };
      }

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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authAPI.logout();
          return { error: 'Authentication failed. Please login again.' };
        }
        if (response.status === 422) {
          const errorData = await response.json();
          const messages = errorData.detail?.map((d: any) => d.msg).filter(Boolean) || [];
          return { error: messages.join(', ') || 'Validation error' };
        }
        const result: ApiResponse = await response.json();
        return { error: result.message || 'Failed to update configuration' };
      }

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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          authAPI.logout();
          return { success: false, error: 'Authentication failed. Please login again.' };
        }
        const result: ApiResponse = await response.json();
        return { success: false, error: result.message || 'Failed to delete configuration' };
      }

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
