"use client";

import { useState, useEffect } from 'react';
import { LogOut, Settings, Palette, Mail, Info, TrendingUp, TrendingDown, Shield, IndianRupee, Percent } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAssets?: number;
}

export default function ProfileModal({ isOpen, onClose, totalAssets = 0 }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      alert('Logged out successfully!');
      onClose();
    }
  };

  const fmtCompact = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold text-sm">SU</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">@sureshkumar</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Member since 2024</p>
            </div>
          </div>

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

            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">App Theme</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

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