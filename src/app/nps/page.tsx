"use client";

import { useState, useEffect, useRef } from 'react'; // ✅ useRef added
import { Plus, Trash2, Edit2, RefreshCw, Home, Shield, Percent, X, Check, ChevronRight, ChevronLeft, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { gsApiCall } from '@/lib/googleSheetsApi';

interface Scheme {
  name: 'E' | 'C' | 'G';
  fullName: string;
  code: string;
  nav: number;
  navDate: string;
  units: number;
  allocation: number;
  investedAmount: number;
}

interface NPSData {
  totalInvested: number;
  schemes: Scheme[];
  createdAt: string;
}

const SCHEME_INFO = {
  E: { name: 'Equity', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  C: { name: 'Corporate Bond', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  G: { name: 'Govt Securities', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
};

export default function NPSPage() {
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

  const [npsData, setNpsData] = useState<NPSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  
  const [totalInvested, setTotalInvested] = useState('');
  const [schemes, setSchemes] = useState<Record<string, { code: string; nav: number; navDate: string; units: number; allocation: number }>>({
    E: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.33 },
    C: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.33 },
    G: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.34 },
  });
  const [fetchingNav, setFetchingNav] = useState<string | null>(null);
  const [editingInvested, setEditingInvested] = useState(false);
  const [editInvestedValue, setEditInvestedValue] = useState('');
  const [editingUnits, setEditingUnits] = useState<Record<string, boolean>>({ E: false, C: false, G: false });
  const [editUnitsValue, setEditUnitsValue] = useState<Record<string, string>>({ E: '', C: '', G: '' });
  
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // ✅ FIX: Ref to prevent infinite loop during background sync
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      loadNPSData();
    }
  }, [isAuthenticated, user?.username]);

  // ✅ Auto-sync with storage events (with loop prevention)
  useEffect(() => {
    const handleStorageChange = () => {
      // ✅ Skip if we're already syncing (prevents infinite loop)
      if (isSyncingRef.current) {
        console.log('⏭️ loadNPSData: Skipping - already syncing');
        return;
      }
      console.log('🔍 MF Page: Storage change detected, reloading...');
      loadNPSData();
    };
    window.addEventListener('storage', handleStorageChange);
    const handleFocus = () => loadNPSData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ✅ CACHE-FIRST: Load from localStorage instantly, then sync with Google Sheets
  const loadNPSData = async () => {
    console.log('🔍 loadNPSData: Starting (Cache-First)...');
    
    // ✅ STEP 1: Load from localStorage IMMEDIATELY (Instant UI)
    const saved = localStorage.getItem('nps_portfolio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('⚡ loadNPSData: Showing cached data instantly');
        setNpsData(parsed);
      } catch (e) {
        console.error('❌ loadNPSData: Cache parse error:', e);
      }
    }
    
    // ✅ STEP 2: Fetch from Google Sheet in BACKGROUND (No UI blocking)
    try {
      // ✅ Set syncing flag to prevent infinite loop
      isSyncingRef.current = true;
      
      const result = await loadPortfolio();
      
      console.log('🔄 loadNPSData: Background API result:', result);
      
      if (result.success && result.portfolio && Array.isArray(result.portfolio)) {
        const npsEntry = result.portfolio.find((p: any) => p.type === 'nps');
        
        if (npsEntry && npsEntry.data) {
          console.log('🔄 loadNPSData: Updating with fresh data');
          setNpsData(npsEntry.data);
          localStorage.setItem('nps_portfolio', JSON.stringify(npsEntry.data));
          // ✅ Don't dispatch storage event here to avoid re-triggering
        }
      }
    } catch (e: unknown) {
      console.error('❌ loadNPSData: Background fetch error:', e);
      // Keep showing cached data if API fails
    } finally {
      // ✅ Reset syncing flag after background sync completes
      isSyncingRef.current = false;
    }
  };

  // ✅ Save to Google Sheets + localStorage
  const saveNPSData = async (data: NPSData) => {
    try {
      await savePortfolio('nps', data);
      localStorage.setItem('nps_portfolio', JSON.stringify(data));
      // ✅ Dispatch storage event to sync other tabs (but not this one due to ref check)
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Save NPS error:', e);
      localStorage.setItem('nps_portfolio', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    if (npsData) {
      localStorage.setItem('nps_portfolio', JSON.stringify(npsData));
      // ✅ Don't dispatch here to avoid loop - only dispatch on save
    }
  }, [npsData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowProfile(false);
      }
    };
    if (showModal || showProfile) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal, showProfile]);

  const safeSchemes = Array.isArray(npsData?.schemes) ? npsData.schemes : [];
  const safeTotalInvested = npsData?.totalInvested || 0;
  
  const totalCurrentValue = safeSchemes.reduce((sum, s) => sum + ((s?.units || 0) * (s?.nav || 0)), 0);
  const totalProfitLoss = totalCurrentValue - safeTotalInvested;
  const totalReturnPercent = safeTotalInvested > 0 ? (totalProfitLoss / safeTotalInvested) * 100 : 0;

  // ✅ Fetch NAV from npsnav.in via Apps Script proxy
  const fetchNav = async (code: string): Promise<{ name: string; nav: number; date: string } | null> => {
    try {
      console.log('📡 Fetching NPS NAV from proxy for code:', code);
      
      const result = await gsApiCall('get-nps-nav', { code });
      
      if (result.success && result.data) {
        console.log('✅ NPS NAV fetched:', result.data);
        return {
          name: result.data.name,
          nav: result.data.nav,
          date: result.data.date,
        };
      } else {
        console.log('⚠️ NAV fetch failed:', result.error);
        return null;
      }
    } catch (e) {
      console.error('❌ NAV fetch error:', e);
      return null;
    }
  };

  // ✅ handleCodeBlur - Fetch NAV when user enters scheme code
  const handleCodeBlur = async (schemeName: 'E' | 'C' | 'G') => {
    const code = schemes[schemeName].code.trim();
    if (!code || code.length < 6) {
      setError('Please enter a valid scheme code');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setFetchingNav(schemeName);
    setError(null);
    
    try {
      console.log('📡 Fetching NAV for:', code);
      
      // Call Apps Script function
      const result = await gsApiCall('get-nps-nav', { code });
      
      if (result.success && result.data) {
        console.log('✅ NAV fetched:', result.data.nav);
        
        // Update scheme with fetched NAV
        setSchemes(prev => ({
          ...prev,
          [schemeName]: { 
            ...prev[schemeName], 
            nav: result.data.nav, 
            navDate: result.data.date 
          },
        }));
        
        setMessage(`${schemeName}: NAV ₹${result.data.nav} fetched!`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError(`${schemeName}: ${result.error || 'NAV fetch failed'}`);
        setTimeout(() => setError(null), 4000);
      }
    } catch (e) {
      console.error('❌ NAV fetch error:', e);
      setError(`${schemeName}: Network error`);
      setTimeout(() => setError(null), 4000);
    }
    
    setFetchingNav(null);
  };

  const handleAllocationChange = (schemeName: 'E' | 'C' | 'G', value: number) => {
    setSchemes(prev => ({
      ...prev,
      [schemeName]: { ...prev[schemeName], allocation: value },
    }));
  };

  const totalAllocation = Object.values(schemes).reduce((sum, s) => sum + s.allocation, 0);
  const canProceedStep1 = totalInvested && parseFloat(totalInvested) > 0;
  const canProceedStep2 = ['E', 'C', 'G'].every(s => schemes[s].code && schemes[s].nav > 0);
  const canProceedStep3 = Math.abs(totalAllocation - 100) < 0.01;
  const canProceedStep4 = ['E', 'C', 'G'].every(s => schemes[s].units > 0);

  const openModal = (edit = false) => {
    setIsEditing(edit);
    setCurrentStep(1);
    setError(null);
    setMessage(null);
    if (edit && npsData && Array.isArray(npsData.schemes)) {
      setTotalInvested(npsData.totalInvested.toString());
      const schemeMap: Record<string, any> = {};
      npsData.schemes.forEach(s => {
        schemeMap[s.name] = {
          code: s.code,
          nav: s.nav,
          navDate: s.navDate,
          units: s.units,
          allocation: s.allocation,
        };
      });
      setSchemes(schemeMap);
    } else {
      setTotalInvested('');
      setSchemes({
        E: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.33 },
        C: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.33 },
        G: { code: '', nav: 0, navDate: '', units: 0, allocation: 33.34 },
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!canProceedStep3) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    
    const newSchemes: Scheme[] = (['E', 'C', 'G'] as const).map(name => ({
      name,
      fullName: SCHEME_INFO[name].name,
      code: schemes[name].code,
      nav: schemes[name].nav,
      navDate: schemes[name].navDate,
      units: schemes[name].units,
      allocation: schemes[name].allocation,
      investedAmount: (parseFloat(totalInvested) * schemes[name].allocation) / 100,
    }));

    const newData: NPSData = {
      totalInvested: parseFloat(totalInvested),
      schemes: newSchemes,
      createdAt: isEditing ? npsData?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    setNpsData(newData);
    await saveNPSData(newData);
    
    setLoading(false);
    setShowModal(false);
    setMessage(isEditing ? 'NPS portfolio updated!' : 'NPS portfolio created!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your NPS portfolio? This cannot be undone.')) {
      try {
        await savePortfolio('nps', null as any);
      } catch (e) {}
      setNpsData(null);
      localStorage.removeItem('nps_portfolio');
      setMessage('NPS portfolio deleted');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const refreshAllNAV = async () => {
    if (!npsData || !Array.isArray(npsData.schemes) || npsData.schemes.length === 0) {
      setError('No portfolio to refresh');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    setLoading(true);
    setMessage('🔄 Fetching latest NAV from API...');
    
    try {
      const updatedSchemes = await Promise.all(
        npsData.schemes.map(async (scheme) => {
          const code = scheme.code;
          const data = await fetchNav(code);
          
          if (data) {
            return { ...scheme, nav: data.nav, navDate: data.date };
          }
          return scheme;
        })
      );
      
      const updatedData = { ...npsData, schemes: updatedSchemes };
      setNpsData(updatedData);
      await saveNPSData(updatedData);
      setLastRefreshed(new Date());
      
      setMessage('✅ All NAVs updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      console.error('Refresh error:', e);
      setError('Failed to refresh NAVs. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
    
    setLoading(false);
  };

  const handleRefreshNav = async (schemeName: 'E' | 'C' | 'G') => {
    if (!npsData || !Array.isArray(npsData.schemes)) return;
    
    setFetchingNav(schemeName);
    const scheme = npsData.schemes.find(s => s.name === schemeName);
    if (!scheme) {
      setFetchingNav(null);
      return;
    }
    
    const code = scheme.code;
    console.log(`📡 Fetching ${schemeName} NAV for code:`, code);
    
    const data = await fetchNav(code);
    
    if (data) {
      const updatedSchemes = npsData.schemes.map(s => 
        s.name === schemeName ? { ...s, nav: data.nav, navDate: data.date } : s
      );
      const updatedData = { ...npsData, schemes: updatedSchemes };
      setNpsData(updatedData);
      await saveNPSData(updatedData);
      setLastRefreshed(new Date());
      
      setMessage(`${schemeName} NAV updated!`);
      setTimeout(() => setMessage(null), 2000);
    } else {
      setError(`${schemeName} NAV fetch failed`);
      setTimeout(() => setError(null), 3000);
    }
    setFetchingNav(null);
  };

  const handleFullRefresh = async () => {
    setLoading(true);
    setMessage('🔄 Refreshing page data...');
    await loadNPSData();
    await refreshAllNAV();
    setTimeout(() => {
      setLoading(false);
      setMessage('✅ Page refreshed!');
      setTimeout(() => setMessage(null), 2000);
    }, 1000);
  };

  const handleEditInvested = () => {
    if (!npsData) return;
    setEditingInvested(true);
    setEditInvestedValue(npsData.totalInvested.toString());
  };

  const handleSaveInvested = async () => {
    if (!npsData || !Array.isArray(npsData.schemes) || !editInvestedValue) return;
    
    const newAmount = parseFloat(editInvestedValue);
    const updatedSchemes = npsData.schemes.map(s => ({
      ...s,
      investedAmount: (newAmount * s.allocation) / 100,
    }));
    
    const updatedData = { ...npsData, totalInvested: newAmount, schemes: updatedSchemes as Scheme[] };
    setNpsData(updatedData);
    await saveNPSData(updatedData);
    
    setEditingInvested(false);
    setMessage('Invested amount updated!');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEditUnits = (schemeName: 'E' | 'C' | 'G') => {
    if (!npsData || !Array.isArray(npsData.schemes)) return;
    
    const scheme = npsData.schemes.find(s => s.name === schemeName);
    if (!scheme) return;
    
    setEditingUnits(prev => ({ ...prev, [schemeName]: true }));
    setEditUnitsValue(prev => ({ ...prev, [schemeName]: scheme.units.toString() }));
  };

  const handleSaveUnits = async (schemeName: 'E' | 'C' | 'G') => {
    if (!npsData || !Array.isArray(npsData.schemes)) return;
    
    const newUnits = parseFloat(editUnitsValue[schemeName]);
    if (!newUnits || newUnits <= 0) return;
    
    const updatedSchemes = npsData.schemes.map(s => 
      s.name === schemeName ? { ...s, units: newUnits } : s
    );
    
    const updatedData = { ...npsData, schemes: updatedSchemes as Scheme[] };
    setNpsData(updatedData);
    await saveNPSData(updatedData);
    
    setEditingUnits(prev => ({ ...prev, [schemeName]: false }));
    setMessage('Units updated!');
    setTimeout(() => setMessage(null), 2000);
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const fmtDate = (d: string) => {
    if (!d) return '';
    const parts = d.includes('-') ? d.split('-') : d.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
    return d;
  };
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <Shield className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">NPS Portfolio</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {npsData ? 'Portfolio Active' : 'No portfolio yet'}
                </p>
                {lastRefreshed && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Last refresh: {fmtTime(lastRefreshed)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFullRefresh} 
                disabled={loading || !npsData} 
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title="Refresh NAV (Click to update)"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => openModal(false)} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                <Plus size={20} />
              </button>
            </div>
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

        {!npsData ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No NPS Portfolio</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Create your NPS portfolio to track Equity, Corporate Bond & Govt Securities</p>
            <button onClick={() => openModal(false)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
              <Plus size={18} /> Create Portfolio
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
                  <button onClick={handleEditInvested} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                    <Edit2 size={12} />
                  </button>
                </div>
                {editingInvested ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={editInvestedValue} onChange={e => setEditInvestedValue(e.target.value)} className="w-full p-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus />
                    <button onClick={handleSaveInvested} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-bold">{fmtMoney(safeTotalInvested)}</p>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                <p className="text-lg font-bold">{fmtMoney(totalCurrentValue)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
                <p className={`text-lg font-bold ${totalReturnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmtPct(totalReturnPercent)}</p>
              </div>
            </div>

            <button onClick={handleDelete} className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
              <Trash2 size={14} /> Delete Portfolio
            </button>

            <div className="space-y-3">
              {safeSchemes.length > 0 ? (
                safeSchemes.map((scheme) => {
                  const currentValue = (scheme?.units || 0) * (scheme?.nav || 0);
                  const profitLoss = currentValue - (scheme?.investedAmount || 0);
                  const isProfit = profitLoss >= 0;
                  const info = SCHEME_INFO[scheme.name];
                  const isEditingThisUnit = editingUnits[scheme.name];
                  
                  return (
                    <div key={scheme.name} className={`rounded-2xl p-4 border ${info.bg} ${info.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.bg}`}>
                            <span className={`font-bold ${info.color}`}>{scheme.name}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{scheme.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{scheme.code}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRefreshNav(scheme.name)} 
                          disabled={fetchingNav === scheme.name} 
                          className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                          title="Refresh NAV"
                        >
                          <RefreshCw className={`w-4 h-4 ${fetchingNav === scheme.name ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">NAV</p>
                          <p className="font-medium">₹{(scheme?.nav || 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{fmtDate(scheme?.navDate || '')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Allocation</p>
                          <p className="font-medium">{(scheme?.allocation || 0).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Units</p>
                          {isEditingThisUnit ? (
                            <div className="flex items-center gap-1">
                              <input type="number" value={editUnitsValue[scheme.name]} onChange={e => setEditUnitsValue(prev => ({ ...prev, [scheme.name]: e.target.value }))} className="w-20 p-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500" step="0.001" autoFocus />
                              <button onClick={() => handleSaveUnits(scheme.name)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <p className="font-medium">{(scheme?.units || 0).toFixed(3)}</p>
                              <button onClick={() => handleEditUnits(scheme.name)} className="p-0.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                                <Edit2 size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
                          <p className="font-medium">{fmtMoney(currentValue)}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Profit/Loss</p>
                            <p className={`font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isProfit ? '+' : ''}{fmtMoney(profitLoss)} ({fmtPct((profitLoss / (scheme?.investedAmount || 1)) * 100)})
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No schemes in portfolio</div>
              )}
            </div>
          </>
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
          <Link href="/nps" className="flex flex-col items-center gap-1 text-indigo-500">
            <Shield size={20} />
            <span className="text-xs">NPS</span>
          </Link>
          <Link href="/fd" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Percent size={20} />
            <span className="text-xs">FD</span>
          </Link>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} totalAssets={totalCurrentValue || 0} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit NPS Portfolio' : 'Create NPS Portfolio'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {currentStep > step ? <Check size={16} /> : step}
                    </div>
                    {step < 4 && <div className={`w-12 h-0.5 mx-2 transition-colors ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Investment</span><span>Schemes</span><span>Allocation</span><span>Units</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
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
              {currentStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Invested Amount (₹)</label>
                  <input type="number" value={totalInvested} onChange={e => setTotalInvested(e.target.value)} placeholder="e.g., 50000" className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {(['E', 'C', 'G'] as const).map(name => (
                    <div key={name} className={`p-3 rounded-lg border ${SCHEME_INFO[name].bg} ${SCHEME_INFO[name].border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-bold ${SCHEME_INFO[name].color}`}>{name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{SCHEME_INFO[name].name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Scheme Code</label>
                          <input 
                            type="text" 
                            value={schemes[name].code} 
                            onChange={e => setSchemes(prev => ({ ...prev, [name]: { ...prev[name], code: e.target.value } }))} 
                            onBlur={() => handleCodeBlur(name)} 
                            placeholder="e.g., SM001003" 
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">NAV</label>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              value={schemes[name].nav || ''} 
                              onChange={e => setSchemes(prev => ({ ...prev, [name]: { ...prev[name], nav: parseFloat(e.target.value) || 0 } }))} 
                              placeholder="Auto" 
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                              step="0.01" 
                            />
                            <button 
                              type="button" 
                              onClick={() => handleCodeBlur(name)} 
                              disabled={fetchingNav === name || !schemes[name].code} 
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${fetchingNav === name ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg ${Math.abs(totalAllocation - 100) < 0.01 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Allocation</span>
                      <span className={`text-lg font-bold ${Math.abs(totalAllocation - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{totalAllocation.toFixed(2)}%</span>
                    </div>
                  </div>
                  {(['E', 'C', 'G'] as const).map(name => (
                    <div key={name} className={`p-3 rounded-lg border ${SCHEME_INFO[name].bg} ${SCHEME_INFO[name].border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold ${SCHEME_INFO[name].color}`}>{name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{SCHEME_INFO[name].name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" value={schemes[name].allocation} onChange={e => handleAllocationChange(name, parseFloat(e.target.value) || 0)} className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" step="0.01" min="0" max="100" />
                        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-4">
                  {(['E', 'C', 'G'] as const).map(name => (
                    <div key={name} className={`p-3 rounded-lg border ${SCHEME_INFO[name].bg} ${SCHEME_INFO[name].border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold ${SCHEME_INFO[name].color}`}>{name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{SCHEME_INFO[name].name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">NAV: ₹{(schemes[name].nav || 0).toFixed(2)}</span>
                      </div>
                      <input type="number" value={schemes[name].units || ''} onChange={e => setSchemes(prev => ({ ...prev, [name]: { ...prev[name], units: parseFloat(e.target.value) || 0 } }))} placeholder="Enter units" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" step="0.001" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1} className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                {currentStep < 4 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={(currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2) || (currentStep === 3 && !canProceedStep3)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSave} disabled={loading || !canProceedStep4} className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
                    {loading ? 'Saving...' : isEditing ? 'Update' : 'Save NPS'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}