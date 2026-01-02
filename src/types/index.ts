export interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  prompt: string;
  max_studies_per_pacs?: number;
  max_total_studies?: number;
  return_evaluation?: boolean;
}

export interface PACSConfiguration {
  id: string;
  display_name: string;
  base_rs: string;
  location?: string;
  headers?: Record<string, string>;
  auth?: Record<string, string>;
  tags: string[];
  created_at?: string;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
}
