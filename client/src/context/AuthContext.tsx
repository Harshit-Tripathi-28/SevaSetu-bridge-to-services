import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '@sevasetu/shared';
import { authService } from '../services/auth.service';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  register: (data: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest): Promise<AuthUser> => {
    const response = await authService.login(credentials);
    if (!response.data?.user) {
      throw new Error(response.message || 'Authentication failed');
    }
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (data: RegisterRequest): Promise<AuthUser> => {
    const response = await authService.register(data);
    if (!response.data?.user) {
      throw new Error(response.message || 'Registration failed');
    }
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
