'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from './api-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData = await api.auth.me();
      setUser({
        id: userData.id || userData.userId || userData._id || '',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationId: userData.organizationId,
        role: userData.role,
        permissions: userData.permissions || [],
      });
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const userData = await api.auth.me();
        if (isMounted) {
          setUser({
            id: userData.id || userData.userId || userData._id || '',
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            organizationId: userData.organizationId,
            role: userData.role,
            permissions: userData.permissions || [],
          });
        }
      } catch {
        tokenStorage.clearTokens();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.auth.login(credentials);
    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    await refreshUser();
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) => {
    const res = await api.auth.register(data);
    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    await refreshUser();
  };

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // ignore error on logout endpoint
      }
    }
    tokenStorage.clearTokens();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
