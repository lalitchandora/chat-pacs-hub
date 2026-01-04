import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types';
import { authAPI } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = authAPI.getToken();
    const storedUser = authAPI.getCurrentUser();
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      // Optionally verify token with /auth/me
      authAPI.me().then(result => {
        if (result.user) {
          setUser(result.user);
        } else {
          // Token invalid, clear auth
          authAPI.logout();
          setUser(null);
          setToken(null);
        }
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authAPI.login(username, password);
    if (result.token) {
      setToken(result.token);
      // Fetch user data after successful login
      const meResult = await authAPI.me();
      if (meResult.user) {
        setUser(meResult.user);
      }
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const signup = async (username: string, password: string) => {
    const result = await authAPI.signup(username, password);
    if (result.user) {
      // After signup, automatically login
      return await login(username, password);
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
