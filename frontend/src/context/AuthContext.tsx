import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Role = 'OWNER' | 'MEMBER' | 'VIEWER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  capacityPoints: number;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AUTH_TOKEN_KEY = 'jwt_token';
const AUTH_USER_KEY  = 'auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [role, setRole] = useState<Role>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return (JSON.parse(stored) as User).role as Role;
    } catch { /* ignore */ }
    return 'VIEWER';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  });

  // Keep localStorage in sync when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
  }, [user]);

  const formatUser = (u: any) => {
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName || 'Unknown User',
      role: u.role || 'MEMBER',
      capacityPoints: u.capacityPoints || 40
    };
  };

  const login = useCallback((token: string, loggedInUser: any) => {
    const normalized = formatUser(loggedInUser);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalized));
    setUser(normalized);
    setRole(normalized?.role as Role);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('levelup_current_project_id');
    setUser(null);
    setRole('VIEWER');
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUser: any) => {
    const normalized = formatUser(updatedUser);
    setUser(normalized);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalized));
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, setRole, isAuthenticated, login, logout, updateUser }}>
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
