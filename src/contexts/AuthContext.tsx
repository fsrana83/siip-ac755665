import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: { password: 'admin123', user: { id: '1', username: 'admin', fullName: 'System Administrator', role: 'admin', active: true } },
  coo: { password: 'coo123', user: { id: '2', username: 'coo', fullName: 'Chief Operating Officer', role: 'coo', active: true } },
  sales01: { password: 'sales123', user: { id: '3', username: 'sales01', fullName: 'Ali Al Farsi', role: 'sales', active: true } },
  uw01: { password: 'uw123', user: { id: '4', username: 'uw01', fullName: 'Hamed Al Lawati', role: 'uw', active: true } },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((username: string, password: string) => {
    const entry = MOCK_USERS[username];
    if (entry && entry.password === password) {
      setUser(entry.user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const hasAccess = (role: UserRole, tab: string, accessMap: Record<string, UserRole[] | null>): boolean => {
  const allowed = accessMap[tab];
  return allowed === null || allowed === undefined || allowed.includes(role);
};
