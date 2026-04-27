"use client";

import { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Home, Shield, Percent, TrendingUp, X, Check, AlertCircle, Loader2, Inbox, Reply } from 'lucide-react';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { gsApiCall } from '@/lib/googleSheetsApi';

interface Message {
  id: string;
  username: string;
  message: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
  reply?: string;
  replyDate?: string;
}

export default function ContactPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  // Load messages
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      loadMessages();
    }
  }, [isAuthenticated, user?.username]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await gsApiCall('load-contact-messages', { username: user?.username });
      
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
    } catch (e) {
      console.error('Load messages error:', e);
    }
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSending(true);

    if (!message.trim()) {
      setError('Please enter a message');
      setSending(false);
      return;
    }

    try {
      const result = await gsApiCall('send-contact-message', {
        username: user?.username,
        message: message.trim()
      });

      if (result.success) {
        setSuccess('Message sent successfully! Admin will reply soon.');
        setMessage('');
        loadMessages();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setSending(false);
  };

  const fmtDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'read': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'replied': return 'Replied';
      case 'read': return 'Read';
      default: return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors">
                <Mail className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">Contact Us</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{messages.length} messages</p>
              </div>
            </div>
            <button onClick={loadMessages} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[100px] pb-24 px-4 space-y-4" style={{ paddingBottom: 'max(24px, calc(24px + env(safe-area-inset-bottom)))' }}>
        
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Send Message Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Send size={18} className="text-green-500" />
            Send a Message
          </h2>
          <form onSubmit={sendMessage} className="space-y-3">
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your query or feedback here..."
                rows={4}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Messages List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Inbox size={18} className="text-blue-500" />
            Your Messages
          </h2>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Send your first message above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => { setSelectedMessage(msg); setShowReplyModal(true); }}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(msg.status)}`}>
                      {getStatusText(msg.status)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(msg.date)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{msg.message}</p>
                  {msg.reply && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Reply size={12} /> Admin replied
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reply Modal (View Message + Admin Reply) */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowReplyModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message Details</h3>
              <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Message</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{fmtDate(selectedMessage.date)}</p>
                </div>
              </div>

              {selectedMessage.reply ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Reply size={12} /> Admin Reply
                  </p>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white">{selectedMessage.reply}</p>
                    {selectedMessage.replyDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{fmtDate(selectedMessage.replyDate)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-center">
                  <p className="text-sm text-orange-600 dark:text-orange-400">⏳ Waiting for admin reply</p>
                  <p className="text-xs text-orange-500 dark:text-orange-500 mt-1">Admin will reply within 24-48 hours</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 z-40" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mutual-funds" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <TrendingUp size={20} />
            <span className="text-xs">MF</span>
          </Link>
          <Link href="/nps" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Shield size={20} />
            <span className="text-xs">NPS</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center gap-1 text-green-500">
            <Mail size={20} />
            <span className="text-xs">Contact</span>
          </Link>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} totalAssets={0} />
    </div>
  );
}