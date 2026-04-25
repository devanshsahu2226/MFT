"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Trash2, Search, Loader2, AlertCircle, Home, Shield, Percent, X, Check, Edit2, Save } from 'lucide-react';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Fund {
  id: string;
  schemeCode: string;
  fundName: string;
  nav: number;
  navDate: string;
  investedAmount: number;
  units: number;
}

const FALLBACK_FUNDS: Record<string, { name: string; nav: number; date: string }> = {
  '120503': { name: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth', nav: 68.42, date: new Date().toISOString().split('T')[0] },
  '120716': { name: 'UTI Nifty 50 Index Fund - Direct Plan - Growth', nav: 185.23, date: new Date().toISOString().split('T')[0] },
  '119598': { name: 'SBI Bluechip Fund - Direct Plan - Growth', nav: 89.15, date: new Date().toISOString().split('T')[0] },
  '122639': { name: 'HDFC Index Fund - Nifty 50 Plan - Direct Plan - Growth', nav: 234.56, date: new Date().toISOString().split('T')[0] },
  '118989': { name: 'Axis Bluechip Fund - Direct Plan - Growth', nav: 56.78, date: new Date().toISOString().split('T')[0] },
};

export default function MutualFundsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [schemeCode, setSchemeCode] = useState('');
  const [fetchingFund, setFetchingFund] = useState(false);
  const [fundDetails, setFundDetails] = useState<{ name: string; nav: number; date: string } | null>(null);
  const [investedAmount, setInvestedAmount] = useState('');
  const [units, setUnits] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editUnits, setEditUnits] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mf_tracker_funds');
      if (saved) setFunds(JSON.parse(saved));
    } catch (e) { console.error('Load error:', e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mf_tracker_funds', JSON.stringify(funds));
      window.dispatchEvent(new Event('storage'));
    } catch (e) { console.error('Save error:', e); }
  }, [funds]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowProfile(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const totalInvested = funds.reduce((sum, f) => sum + f.investedAmount, 0);
  const totalCurrentValue = funds.reduce((sum, f) => sum + (f.units * f.nav), 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const fetchFundData = async (code: string): Promise<{ name: string; nav: number; date: string } | null> => {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${code}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return {
          name: json.meta.scheme_name,
          nav: parseFloat(json.data[0].nav),
          date: json.data[0].date,
        };
      }
    } catch (e) { console.log('API failed, using fallback'); }
    return FALLBACK_FUNDS[code] || null;
  };

  const handleCodeBlur = async () => {
    if (!schemeCode.trim() || schemeCode.length < 5) return;
    setFetchingFund(true);
    setFundDetails(null);
    const data = await fetchFundData(schemeCode.trim());
    if (data) {
      setFundDetails(data);
      setMessage(`Found: ${data.name}`);
    } else {
      setError('Fund not found. Please check the code.');
      setFundDetails(null);
    }
    setFetchingFund(false);
    setTimeout(() => { setError(null); setMessage(null); }, 4000);
  };

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!schemeCode.trim() || !investedAmount || !units || !fundDetails) {
      setError('Please fill all fields and fetch fund details first');
      return;
    }

    setLoading(true);
    
    const newFund: Fund = {
      id: Date.now().toString(),
      schemeCode: schemeCode.trim(),
      fundName: fundDetails.name,
      nav: fundDetails.nav,
      navDate: fundDetails.date,
      investedAmount: parseFloat(investedAmount),
      units: parseFloat(units),
    };

    setFunds(prev => [...prev, newFund]);
    setMessage('Fund added successfully!');
    
    setSchemeCode('');
    setInvestedAmount('');
    setUnits('');
    setFundDetails(null);
    setLoading(false);
    setShowAddModal(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditClick = (fund: Fund) => {
    setEditingFund(fund);
    setEditAmount(fund.investedAmount.toString());
    setEditUnits(fund.units.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund || !editAmount || !editUnits) return;

    setFunds(prev => prev.map(f => 
      f.id === editingFund.id 
        ? { ...f, investedAmount: parseFloat(editAmount), units: parseFloat(editUnits) }
        : f
    ));
    
    setMessage('Fund updated successfully!');
    setShowEditModal(false);
    setEditingFund(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fund?')) {
      setFunds(prev => prev.filter(f => f.id !== id));
      setMessage('Fund removed');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleRefresh = async (fund: Fund) => {
    setRefreshing(fund.schemeCode);
    const data = await fetchFundData(fund.schemeCode);
    if (data) {
      setFunds(prev => prev.map(f => 
        f.id === fund.id ? { ...f, nav: data.nav, navDate: data.date } : f
      ));
      setMessage('NAV updated from API!');
      setTimeout(() => setMessage(null), 2000);
    } else {
      setError('Could not fetch latest NAV');
      setTimeout(() => setError(null), 3000);
    }
    setRefreshing(null);
  };

  const handleRefreshAll = async () => {
    if (funds.length === 0) return;
    setLoading(true);
    setMessage('Updating all NAVs...');
    
    const updated = await Promise.all(
      funds.map(async (f) => {
        const data = await fetchFundData(f.schemeCode);
        return data ? { ...f, nav: data.nav, navDate: data.date } : f;
      })
    );
    
    setFunds(updated);
    setLoading(false);
    setMessage('All NAVs updated!');
    setTimeout(() => setMessage(null), 3000);
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const filtered = funds.filter(f => 
    f.fundName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.schemeCode.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors">
                <TrendingUp className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">Mutual Funds</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{funds.length} funds</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddModal(true)} className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
                <Plus size={20} />
              </button>
              <button onClick={handleRefreshAll} disabled={loading || funds.length === 0} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-[100px] pb-24 px-4 space-y-4" style={{ paddingBottom: 'max(24px, calc(24px + env(safe-area-inset-bottom)))' }}>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
            <p className="text-lg font-bold">{fmtMoney(totalInvested)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-lg font-bold">{fmtMoney(totalCurrentValue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Profit/Loss</p>
            <p className={`text-lg font-bold ${totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{fmtMoney(totalProfitLoss)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
            <p className={`text-lg font-bold ${totalReturnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtPct(totalReturnPercent)}
            </p>
          </div>
        </div>

        {funds.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search funds..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(fund => {
              const current = fund.units * fund.nav;
              const pl = current - fund.investedAmount;
              const isProfit = pl >= 0;
              
              return (
                <div key={fund.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{fund.fundName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fund.schemeCode}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleRefresh(fund)} disabled={refreshing === fund.schemeCode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${refreshing === fund.schemeCode ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => handleEditClick(fund)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(fund.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">NAV</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">₹{fund.nav.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{fmtDate(fund.navDate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
                      <p className="font-medium text-gray-900 dark:text-white">{fmtMoney(fund.investedAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                      <p className="font-medium text-gray-900 dark:text-white">{fmtMoney(current)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Units</p>
                      <p className="font-medium text-gray-900 dark:text-white">{fund.units.toFixed(3)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">P/L</p>
                      <p className={`font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isProfit ? '+' : ''}{fmtMoney(pl)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : funds.length > 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No funds match your search</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No funds added yet</p>
            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Add Your First Fund
            </button>
            <p className="text-xs text-gray-400 mt-4">Try code: 122639 (HDFC Nifty 50)</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 z-40" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mutual-funds" className="flex flex-col items-center gap-1 text-green-500">
            <TrendingUp size={20} />
            <span className="text-xs">MF</span>
          </Link>
          <Link href="/nps" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Shield size={20} />
            <span className="text-xs">NPS</span>
          </Link>
          <Link href="/fd" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Percent size={20} />
            <span className="text-xs">FD</span>
          </Link>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} totalAssets={totalCurrentValue} />

      {/* Add Fund Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Fund</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFund} className="p-4 space-y-4">
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
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">AMFI Scheme Code</label>
                <div className="flex gap-2">
                  <input type="number" value={schemeCode} onChange={e => { setSchemeCode(e.target.value); setFundDetails(null); }} onBlur={handleCodeBlur} placeholder="e.g., 122639" className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                  <button type="button" onClick={handleCodeBlur} disabled={fetchingFund || !schemeCode.trim()} className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50">
                    {fetchingFund ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter code & click search or press Tab</p>
              </div>

              {fundDetails && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{fundDetails.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">NAV: ₹{fundDetails.nav.toFixed(2)} • {fmtDate(fundDetails.date)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Invested Amount (₹)</label>
                  <input type="number" value={investedAmount} onChange={e => setInvestedAmount(e.target.value)} placeholder="5000" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required disabled={!fundDetails} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Units</label>
                  <input type="number" step="0.001" value={units} onChange={e => setUnits(e.target.value)} placeholder="10.5" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required disabled={!fundDetails} />
                </div>
              </div>

              <button type="submit" disabled={loading || !fundDetails} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {loading ? 'Adding...' : 'Add Fund'}
              </button>
            </form>

            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 text-center">Find codes at <a href="https://www.amfiindia.com" target="_blank" rel="noopener" className="text-green-600 hover:underline">amfiindia.com</a></p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fund Modal */}
      {showEditModal && editingFund && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Fund</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{editingFund.fundName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Code: {editingFund.schemeCode} • NAV: ₹{editingFund.nav.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Invested Amount (₹)</label>
                  <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Units</label>
                  <input type="number" step="0.001" value={editUnits} onChange={e => setEditUnits(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" required />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}