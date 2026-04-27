"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gsApiCall } from '@/lib/googleSheetsApi';

interface User {
  username: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  register: (username: string, password: string, joinedDate: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (username: string, joinedDate: string) => Promise<{ success: boolean; error?: string }>;
  contactUs: (message: string) => Promise<{ success: boolean; error?: string }>;
  savePortfolio: (type: string, data: any) => Promise<{ success: boolean }>;
  loadPortfolio: () => Promise<{ success: boolean; portfolio: any[] }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('mutualtrack-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ AuthProvider: Loaded user from localStorage:', parsed);
        setUser(parsed);
      } else {
        console.log('⚠️ AuthProvider: No user in localStorage');
      }
    } catch (e) {
      console.error('❌ AuthProvider: Error loading user:', e);
    }
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    console.log('📡 login: Attempting login for:', username);
    
    try {
      const result = await gsApiCall('login', { username, password });
      console.log('📥 login: API response:', result);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('mutualtrack-user', JSON.stringify(result.user));
        console.log('✅ login: User logged in successfully:', result.user);
      } else {
        console.log('❌ login: Login failed:', result.error);
      }
      
      return result;
    } catch (e) {
      console.error('❌ login: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 logout: Logging out user:', user?.username);
    
    setUser(null);
    localStorage.removeItem('mutualtrack-user');
    localStorage.removeItem('mf_tracker_funds');
    localStorage.removeItem('nps_portfolio');
    localStorage.removeItem('fd_portfolio');
    
    console.log('✅ logout: All data cleared');
    window.location.href = '/auth';
  };

  // Register function
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

  // Change Password function
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user?.username) {
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('📡 changePassword: For user:', user.username);
    
    try {
      const result = await gsApiCall('change-password', { 
        username: user.username, 
        oldPassword, 
        newPassword 
      });
      console.log('📥 changePassword: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ changePassword: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  // Forgot Password function
  const forgotPassword = async (username: string, joinedDate: string) => {
    console.log('📡 forgotPassword: For user:', username);
    
    try {
      const result = await gsApiCall('forgot-password', { username, joinedDate });
      console.log('📥 forgotPassword: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ forgotPassword: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  // Contact Us function
  const contactUs = async (message: string) => {
    if (!user?.username) {
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('📡 contactUs: From user:', user.username);
    
    try {
      const result = await gsApiCall('contact', { username: user.username, message });
      console.log('📥 contactUs: API response:', result);
      return result;
    } catch (e) {
      console.error('❌ contactUs: Error:', e);
      return { success: false, error: 'Network error' };
    }
  };

  // Save Portfolio function
  const savePortfolio = async (type: string, data: any) => {
    if (!user?.username) {
      console.log('❌ savePortfolio: No user logged in');
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('📡 savePortfolio: Saving', type, 'for user:', user.username);
    console.log('📡 savePortfolio: Data:', data);
    
    try {
      const result = await gsApiCall('save-portfolio', { 
        username: user.username, 
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

  // Load Portfolio function (FIXED - with JSON parsing)
  const loadPortfolio = async () => {
    if (!user?.username) {
      console.log('❌ loadPortfolio: No user logged in');
      return { success: false, error: 'Not authenticated', portfolio: [] };
    }
    
    console.log('📡 loadPortfolio: Loading for user:', user.username);
    
    try {
      const result = await gsApiCall('load-portfolio', { username: user.username });
      
      console.log('📥 loadPortfolio: Raw API result:', result);
      console.log('📥 loadPortfolio: result.success:', result?.success);
      console.log('📥 loadPortfolio: result.portfolio:', result?.portfolio);
      
      if (result.success && Array.isArray(result.portfolio)) {
        console.log('✅ loadPortfolio: Found', result.portfolio.length, 'portfolios');
        
        // Parse each portfolio entry's data field (string → JSON)
        const parsedPortfolio = result.portfolio.map((entry: any) => {
          try {
            console.log('🔍 loadPortfolio: Processing entry:', entry);
            
            // If data is string, parse it
            if (typeof entry.data === 'string') {
              entry.data = JSON.parse(entry.data);
              console.log('✅ loadPortfolio: Parsed string data to JSON');
            } else {
              console.log('✅ loadPortfolio: Data already JSON object');
            }
            
            return entry;
          } catch (e) {
            console.error('❌ loadPortfolio: Parse error for entry:', entry, e);
            return entry;
          }
        });
        
        console.log('✅ loadPortfolio: Returning parsed portfolio:', parsedPortfolio);
        return { success: true, portfolio: parsedPortfolio };
      }
      
      console.log('⚠️ loadPortfolio: No portfolio data found');
      return { success: true, portfolio: [] };
    } catch (e) {
      console.error('❌ loadPortfolio: Error:', e);
      return { success: false, error: 'Load failed', portfolio: [] };
    }
  };

  // Don't render until mounted
  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      register, 
      changePassword, 
      forgotPassword, 
      contactUs, 
      savePortfolio, 
      loadPortfolio 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}