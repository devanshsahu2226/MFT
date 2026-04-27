"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Edit2, Home, Shield, Percent, X, Check, AlertCircle, IndianRupee, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface FD {
  id: string;
  bankName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  maturityAmount: number;
}

export default function FDPage() {
  const { isAuthenticated, user, savePortfolio, loadPortfolio } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const [fds, setFds] = useState<FD[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFd, setEditingFd] = useState<FD | null>(null);
  const [editPrincipal, setEditPrincipal] = useState('');
  const [editRate, setEditRate] = useState('');

  // Load from Google Sheets on mount
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      loadFDData();
    }
  }, [isAuthenticated, user?.username]);

  // Auto-sync with Home page
  useEffect(() => {
    const handleStorageChange = () => loadFDData();
    window.addEventListener('storage', handleStorageChange);
    const handleFocus = () => loadFDData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Load from Google Sheets (with safe array handling)
  const loadFDData = async () => {
  console.log('🔍 loadFDData: Starting...');
  
  // ✅ Step 1: Load from localStorage IMMEDIATELY
  const saved = localStorage.getItem('fd_portfolio');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        console.log('⚡ loadFDData: Showing cached data instantly:', parsed.length, 'FDs');
        setFds(parsed);
      }
    } catch (e) {
      console.error('Cache parse error:', e);
    }
  }
  
  // ✅ Step 2: Fetch from Google Sheet in background
  try {
    const result = await loadPortfolio();
    
    if (result.success && result.portfolio && Array.isArray(result.portfolio)) {
      const fdEntry = result.portfolio.find((p: any) => p.type === 'fd');
      
      if (fdEntry && fdEntry.data && Array.isArray(fdEntry.data)) {
        console.log('🔄 loadFDData: Updating with fresh data:', fdEntry.data.length, 'FDs');
        setFds(fdEntry.data);
        localStorage.setItem('fd_portfolio', JSON.stringify(fdEntry.data));
      }
    }
  } catch (e) {
    console.error('❌ loadFDData: Background fetch error:', e);
  }
};

  // Save to Google Sheets + localStorage
  const saveFDData = async (newFds: FD[]) => {
    try {
      await savePortfolio('fd', newFds);
      localStorage.setItem('fd_portfolio', JSON.stringify(newFds));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Save error:', e);
      localStorage.setItem('fd_portfolio', JSON.stringify(newFds));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Safe calculations
  const safeFds = Array.isArray(fds) ? fds : [];
  const totalPrincipal = safeFds.reduce((sum, fd) => sum + fd.principalAmount, 0);
  const totalMaturity = safeFds.reduce((sum, fd) => sum + fd.maturityAmount, 0);
  const totalInterest = totalMaturity - totalPrincipal;
  const avgReturn = totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;

  const calculateMaturity = (principal: number, rate: number, months: number) => {
    // Simple compound interest formula: A = P(1 + r/n)^(nt)
    const years = months / 12;
    const maturity = principal * Math.pow(1 + (rate / 100), years);
    return parseFloat(maturity.toFixed(2));
  };

  const handleAddFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!bankName || !principalAmount || !interestRate || !tenureMonths || !startDate) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    
    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);
    const months = parseInt(tenureMonths);
    const maturity = calculateMaturity(principal, rate, months);

    const newFd: FD = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      bankName,
      principalAmount: principal,
      interestRate: rate,
      tenureMonths: months,
      startDate,
      maturityAmount: maturity,
    };

    const newFds = [...safeFds, newFd];
    setFds(newFds);
    await saveFDData(newFds);
    
    setMessage('FD added successfully!');
    setBankName('');
    setPrincipalAmount('');
    setInterestRate('');
    setTenureMonths('');
    setStartDate('');
    setLoading(false);
    setShowAddModal(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditClick = (fd: FD) => {
    setEditingFd(fd);
    setEditPrincipal(fd.principalAmount.toString());
    setEditRate(fd.interestRate.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFd || !editPrincipal || !editRate) return;

    const principal = parseFloat(editPrincipal);
    const rate = parseFloat(editRate);
    const maturity = calculateMaturity(principal, rate, editingFd.tenureMonths);

    const newFds = safeFds.map(fd => 
      fd.id === editingFd.id 
        ? { ...fd, principalAmount: principal, interestRate: rate, maturityAmount: maturity }
        : fd
    );
    
    setFds(newFds);
    await saveFDData(newFds);
    
    setMessage('FD updated successfully!');
    setShowEditModal(false);
    setEditingFd(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this FD?')) {
      const newFds = safeFds.filter(fd => fd.id !== id);
      setFds(newFds);
      await saveFDData(newFds);
      setMessage('FD removed');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  // ✅ FIXED: Accept both Date and string
  const fmtDate = (d: string | Date) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n.toFixed(2)}%`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors">
                <IndianRupee className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">Fixed Deposits</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{safeFds.length} FDs</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[100px] pb-24 px-4 space-y-4" style={{ paddingBottom: 'max(24px, calc(24px + env(safe-area-inset-bottom)))' }}>
        
        {message && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
            <Check size={14} /> {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
            <p className="text-lg font-bold">{fmtMoney(totalPrincipal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Maturity</p>
            <p className="text-lg font-bold">{fmtMoney(totalMaturity)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Interest</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">+{fmtMoney(totalInterest)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmtPct(avgReturn)}</p>
          </div>
        </div>

        {safeFds.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No FDs Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Add your first fixed deposit to track maturity</p>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
              <Plus size={18} /> Add Your First FD
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {safeFds.map((fd, index) => {
              const fdKey = fd.id || `${fd.bankName}-${fd.startDate}-${index}`;
              const interest = fd.maturityAmount - fd.principalAmount;
              
              // ✅ FIXED: Calculate maturity date properly
              const startDateObj = new Date(fd.startDate);
              const maturityDateObj = new Date(startDateObj.setMonth(startDateObj.getMonth() + fd.tenureMonths));
              const maturityDateStr = maturityDateObj.toISOString().split('T')[0];
              
              return (
                <div key={fdKey} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{fd.bankName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {fd.interestRate}% • {fd.tenureMonths} months
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEditClick(fd)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(fdKey)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{fmtDate(fd.startDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Maturity Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fmtDate(maturityDateStr)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
                      <p className="font-medium text-gray-900 dark:text-white">{fmtMoney(fd.principalAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Maturity Value</p>
                      <p className="font-medium text-green-600 dark:text-green-400">{fmtMoney(fd.maturityAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Interest Earned</p>
                      <p className="font-medium text-green-600 dark:text-green-400">+{fmtMoney(interest)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {fmtPct((interest / fd.principalAmount) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
          <Link href="/fd" className="flex flex-col items-center gap-1 text-green-500">
            <Percent size={20} />
            <span className="text-xs">FD</span>
          </Link>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} totalAssets={totalMaturity} />

      {/* Add FD Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Fixed Deposit</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFD} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {message && !error && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                  <Check size={14} /> {message}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bank Name</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., SBI, HDFC" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Principal (₹)</label>
                  <input type="number" value={principalAmount} onChange={e => setPrincipalAmount(e.target.value)} placeholder="100000" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="7.5" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tenure (Months)</label>
                  <input type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} placeholder="60" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                {loading ? 'Adding...' : 'Add FD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit FD Modal */}
      {showEditModal && editingFd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit FD</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{editingFd.bankName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {editingFd.tenureMonths} months • Started: {fmtDate(editingFd.startDate)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Principal (₹)</label>
                  <input type="number" value={editPrincipal} onChange={e => setEditPrincipal(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.01" value={editRate} onChange={e => setEditRate(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <Check size={18} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}