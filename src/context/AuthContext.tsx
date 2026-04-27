"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gsApiCall } from '@/lib/googleSheetsApi';

interface User {
  username: string;
  joinedDate: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, joinedDate: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  savePortfolio: (type: string, data: any) => Promise<{ success: boolean; error?: string }>;
  loadPortfolio: () => Promise<{ success: boolean; portfolio?: any[]; error?: string }>;
  forgotPassword: (username: string, joinedDate: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (username: string, currentPassword: string, newPassword: string, joinedDate: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('mutualtrack-user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('mutualtrack-user');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    console.log('📡 login: Attempting login for:', username);
    
    try {
      const result = await gsApiCall('login', { username, password });
      console.log('📥 login: API response:', result);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('mutualtrack-user', JSON.stringify(result.user));
        console.log('✅ login: Success');
      }
      
      return result;
    } catch (e) {
      console.error('❌ login: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (username: string, password: string, joinedDate: string) => {
    console.log('📡 register: Attempting registration for:', username);
    
    try {
      const result = await gsApiCall('register', { username, password, joinedDate });
      console.log('📥 register: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ register: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('mutualtrack-user');
    localStorage.removeItem('mf_tracker_funds');
    localStorage.removeItem('nps_portfolio');
    localStorage.removeItem('fd_portfolio');
    console.log('✅ logout: Success');
  };

  const savePortfolio = async (type: string, data: any) => {
    console.log('📡 savePortfolio: Saving', type, 'portfolio');
    
    try {
      const result = await gsApiCall('save-portfolio', { 
        username: user?.username, 
        type, 
        data 
      });
      console.log('📥 savePortfolio: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ savePortfolio: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const loadPortfolio = async () => {
    console.log('📡 loadPortfolio: Loading for user:', user?.username);
    
    try {
      const result = await gsApiCall('load-portfolio', { username: user?.username });
      console.log('📥 loadPortfolio: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ loadPortfolio: Error:', e);
      return { success: false, error: 'Network error', portfolio: [] };
    }
  };

  const forgotPassword = async (username: string, joinedDate: string, newPassword: string) => {
    console.log('📡 forgotPassword: Request for user:', username);
    
    try {
      const result = await gsApiCall('forgot-password', { 
        username, 
        joinedDate,
        newPassword
      });
      console.log('📥 forgotPassword: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ forgotPassword: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  const changePassword = async (username: string, currentPassword: string, newPassword: string, joinedDate: string) => {
    console.log('📡 changePassword: Request for user:', username);
    
    try {
      const result = await gsApiCall('change-password', { 
        username, 
        currentPassword,
        newPassword,
        joinedDate
      });
      console.log('📥 changePassword: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ changePassword: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        savePortfolio,
        loadPortfolio,
        forgotPassword,
        changePassword,
      }}
    >
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