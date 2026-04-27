"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Palette, Mail, Info, Moon, Sun, Check, Shield, X, AlertCircle, Loader2, Key } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAssets?: number;
}

export default function ProfileModal({ isOpen, onClose, totalAssets = 0 }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { logout, user, changePassword } = useAuth();
  const router = useRouter(); // ✅ Added router

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordMessage, setChangePasswordMessage] = useState<string | null>(null);

  // Mount check
  useEffect(() => {
    setMounted(true);
    
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
        setShowChangePasswordModal(false);
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

  // Theme toggle handler
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setShowThemeOptions(false);
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    try {
      localStorage.setItem('mutualtrack-theme', newTheme);
    } catch (e) {
      console.log('localStorage error:', e);
    }
  };

  // ✅ Auto-format date input (DD/MM/YYYY)
  const formatDateInput = (value: string): string => {
    value = value.replace(/\D/g, '');
    if (value.length > 2 && value.length <= 4) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    } else if (value.length > 4) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
    }
    return value;
  };

  // ✅ Validate DD/MM/YYYY format
  const isValidDate = (dateStr: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // ✅ Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordMessage(null);
    setChangePasswordLoading(true);

    if (!currentPassword || !newPassword || !confirmPassword || !joinedDate) {
      setChangePasswordError('All fields are required');
      setChangePasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match');
      setChangePasswordLoading(false);
      return;
    }

    if (!isValidDate(joinedDate)) {
      setChangePasswordError('Please enter a valid date in DD/MM/YYYY format');
      setChangePasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('Password must be at least 6 characters');
      setChangePasswordLoading(false);
      return;
    }

    try {
      const result = await changePassword(user?.username || '', currentPassword, newPassword, joinedDate);
      
      if (result.success) {
        setChangePasswordMessage('Password change request submitted! Wait for admin approval.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setJoinedDate('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setChangePasswordMessage(null);
        }, 3000);
      } else {
        setChangePasswordError(result.error || 'Request failed. Check your details.');
      }
    } catch (err) {
      setChangePasswordError('An error occurred. Please try again.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // ✅ Contact Us Handler
  const handleContactUs = () => {
    onClose(); // Close modal first
    router.push('/contact'); // Navigate to contact page
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div 
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 space-y-4">
            
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">@{user?.username || 'Guest'}</p>
                <p className="text-sm text-green-500 dark:text-green-400">
                  Hello! 👋
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
              {/* Change Password Button */}
              <button 
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Key size={18} className="text-gray-500 dark:text-gray-400" />
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

              {/* ✅ Contact Us Button - FIXED with onClick */}
              <button 
                onClick={handleContactUs}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangePasswordModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key size={20} className="text-green-500" />
                Change Password
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-4 space-y-4">
              {changePasswordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {changePasswordError}
                </div>
              )}
              {changePasswordMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                  <Check size={14} /> {changePasswordMessage}
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-xs">
                <p className="font-medium mb-1">📝 How it works:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Enter current password</li>
                  <li>Enter new password (min 6 characters)</li>
                  <li>Enter your join date (same as registration)</li>
                  <li>Admin will approve your request</li>
                  <li>New password will be activated</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Join Date (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(formatDateInput(e.target.value))}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Same date you used during registration
                </p>
              </div>

              <button
                type="submit"
                disabled={changePasswordLoading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {changePasswordLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {changePasswordLoading ? 'Submitting Request...' : 'Submit Request'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                ⏱️ Admin will review within 24-48 hours
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}