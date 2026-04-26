"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Palette, Mail, Info, Moon, Sun, Check, Shield } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAssets?: number;
}

export default function ProfileModal({ isOpen, onClose, totalAssets = 0 }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { logout, user } = useAuth();

  // Mount check
  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage directly (no context dependency)
    try {
      const saved = localStorage.getItem('mutualtrack-theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setShowThemeOptions(false);
      }
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Logout handler
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      onClose();
    }
  };

  // Theme toggle handler (direct localStorage, no context)
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setShowThemeOptions(false);
    
    // Apply theme directly
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    try {
      localStorage.setItem('mutualtrack-theme', newTheme);
    } catch (e) {
      console.log('localStorage error:', e);
    }
  };

  // Format helper
  const fmtCompact = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  // Don't render until mounted
  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'SU'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">@{user?.username || 'Guest'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Member since {user?.joinedDate || '2024'}
              </p>
            </div>
            <Shield size={18} className="text-green-500" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">TOTAL ASSETS</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmtCompact(totalAssets)}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HOLDINGS</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">4 items</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Change Password</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* App Theme Button */}
            <button 
              onClick={() => setShowThemeOptions(!showThemeOptions)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">App Theme</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {theme}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Theme Options Dropdown */}
            {showThemeOptions && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-600/50'}`}
                >
                  <Sun size={18} className="text-yellow-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Light</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Always use light theme</p>
                  </div>
                  {theme === 'light' && <Check size={20} className="text-green-500" />}
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-600/50'}`}
                >
                  <Moon size={18} className="text-indigo-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dark</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Always use dark theme</p>
                  </div>
                  {theme === 'dark' && <Check size={20} className="text-green-500" />}
                </button>
              </div>
            )}

            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Contact Us</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">App Version</span>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">v2.0</span>
            </button>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-colors font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}