import { User, ChatMessage, PACSConfiguration } from '@/types';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Dummy users storage
const USERS_KEY = 'medchat_users';
const PACS_KEY = 'medchat_pacs';

interface StoredUser extends User {
  password: string;
}

const getStoredUsers = (): StoredUser[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Auth API
export const authAPI = {
  async login(username: string, password: string): Promise<{ user?: User; error?: string }> {
    await delay(800);
    
    const users = getStoredUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
      return { user: userWithoutPassword };
    }
    
    return { error: 'Invalid username or password' };
  },

  async signup(username: string, email: string, password: string): Promise<{ user?: User; error?: string }> {
    await delay(800);
    
    const users = getStoredUsers();
    
    if (users.find(u => u.username === username)) {
      return { error: 'Username already exists' };
    }
    
    if (users.find(u => u.email === email)) {
      return { error: 'Email already registered' };
    }
    
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    return { user: userWithoutPassword };
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('current_user');
  },
};

// Chat API (Dummy)
export const chatAPI = {
  async sendMessage(message: string): Promise<string> {
    await delay(1000 + Math.random() * 1000);
    
    const responses = [
      "I understand you're asking about medical imaging. PACS systems are essential for managing radiological data efficiently.",
      "That's a great question! In medical imaging, proper configuration of PACS nodes is crucial for seamless data transfer.",
      "Based on your query, I'd recommend checking your DICOM settings and ensuring proper network connectivity between nodes.",
      "Medical imaging workflows require careful attention to detail. Let me help you understand the key aspects of your configuration.",
      "PACS (Picture Archiving and Communication System) is fundamental to modern radiology. How can I assist you further?",
      "I can help you with various aspects of medical imaging, from DICOM protocols to workflow optimization.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  },
};

// PACS API
export const pacsAPI = {
  getConfigurations(): PACSConfiguration[] {
    const configs = localStorage.getItem(PACS_KEY);
    return configs ? JSON.parse(configs) : [];
  },

  saveConfiguration(config: Omit<PACSConfiguration, 'id' | 'createdAt'>): PACSConfiguration {
    const configs = this.getConfigurations();
    const newConfig: PACSConfiguration = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    configs.push(newConfig);
    localStorage.setItem(PACS_KEY, JSON.stringify(configs));
    return newConfig;
  },

  deleteConfiguration(id: string): boolean {
    const configs = this.getConfigurations();
    const filtered = configs.filter(c => c.id !== id);
    localStorage.setItem(PACS_KEY, JSON.stringify(filtered));
    return filtered.length < configs.length;
  },

  updateConfiguration(id: string, updates: Partial<PACSConfiguration>): PACSConfiguration | null {
    const configs = this.getConfigurations();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    configs[index] = { ...configs[index], ...updates };
    localStorage.setItem(PACS_KEY, JSON.stringify(configs));
    return configs[index];
  },
};
