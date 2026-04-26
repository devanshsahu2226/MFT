"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  register: (username: string, password: string, joinedDate: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedUser = localStorage.getItem('mutualtrack-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.log('Auth load error:', e);
    }
  }, []);

  const login = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('mutualtrack-users') || '[]');
    const foundUser = users.find((u: any) => u.username === username);
    
    if (!foundUser) {
      return { success: false, error: 'User not registered. Please create an account first.' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }
    
    setUser({ username: foundUser.username, joinedDate: foundUser.joinedDate });
    localStorage.setItem('mutualtrack-user', JSON.stringify({ username: foundUser.username, joinedDate: foundUser.joinedDate }));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mutualtrack-user');
    window.location.href = '/auth';
  };

  const register = (username: string, password: string, joinedDate: string) => {
    const users = JSON.parse(localStorage.getItem('mutualtrack-users') || '[]');
    
    if (users.find((u: any) => u.username === username)) {
      return { success: false, error: 'Username already exists. Please choose another.' };
    }
    
    const newUser = { username, password, joinedDate };
    users.push(newUser);
    localStorage.setItem('mutualtrack-users', JSON.stringify(users));
    
    return { success: true };
  };

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}