"use client";
import { TrendingUp, TrendingDown, RefreshCw, Home, Shield, Percent, IndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';

// Types for data from other pages
interface MFData {
  investedAmount: number;
  currentValue: number;
}

interface NPSData {
  totalInvested: number;
  schemes: { units: number; nav: number; allocation: number }[];
}

interface FDData {
  principalAmount: number;
  maturityAmount: number;
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState('');
  const [animated, setAnimated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Portfolio Data (from localStorage)
  const [mfData, setMfData] = useState<MFData>({ investedAmount: 0, currentValue: 0 });
  const [npsData, setNpsData] = useState<NPSData>({ totalInvested: 0, schemes: [] });
  const [fdData, setFdData] = useState<FDData>({ principalAmount: 0, maturityAmount: 0 });

  // Load data from localStorage
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = () => {
    try {
      const mfSaved = localStorage.getItem('mf_tracker_funds');
      if (mfSaved) {
        const mfFunds = JSON.parse(mfSaved);
        const invested = mfFunds.reduce((sum: number, f: any) => sum + f.investedAmount, 0);
        const current = mfFunds.reduce((sum: number, f: any) => sum + (f.units * f.nav), 0);
        setMfData({ investedAmount: invested, currentValue: current });
      }

      const npsSaved = localStorage.getItem('nps_portfolio');
      if (npsSaved) {
        const nps = JSON.parse(npsSaved);
        setNpsData(nps);
      }

      const fdSaved = localStorage.getItem('fd_portfolio');
      if (fdSaved) {
        const fdFunds = JSON.parse(fdSaved);
        const invested = fdFunds.reduce((sum: number, f: any) => sum + f.principalAmount, 0);
        const current = fdFunds.reduce((sum: number, f: any) => sum + parseFloat(f.maturityAmount), 0);
        setFdData({ principalAmount: invested, maturityAmount: current });
      }
    } catch (e) {
      console.error('Error loading portfolio data', e);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAnimated(true);
  }, []);

  const [showProfile, setShowProfile] = useState(false);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProfile(false);
    };
    if (showProfile) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      alert('Logged out successfully!');
      setShowProfile(false);
    }
  };

  const totalInvested = mfData.investedAmount + npsData.totalInvested + fdData.principalAmount;
  const totalCurrent = mfData.currentValue + (npsData.schemes.reduce((sum, s) => sum + (s.units * s.nav), 0)) + fdData.maturityAmount;
  const totalProfitLoss = totalCurrent - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const mfAllocation = totalCurrent > 0 ? (mfData.currentValue / totalCurrent) * 100 : 0;
  const npsAllocation = totalCurrent > 0 ? ((npsData.schemes.reduce((sum, s) => sum + (s.units * s.nav), 0)) / totalCurrent) * 100 : 0;
  const fdAllocation = totalCurrent > 0 ? (fdData.maturityAmount / totalCurrent) * 100 : 0;

  const circumference = 2 * Math.PI * 40;
  const mfOffset = circumference - (mfAllocation / 100) * circumference;
  const npsOffset = circumference - (npsAllocation / 100) * circumference;
  const fdOffset = circumference - (fdAllocation / 100) * circumference;

  const fmtMoney = (n: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  
  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  
  const fmtCompact = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <TrendingUp className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">MutualTrack</h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  sureshkumar
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} size={20} />
            </button>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nifty 50</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24,173.05</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-500 flex items-center gap-1 justify-end">
                  <TrendingDown size={14} /> -205.05
                </p>
                <p className="text-xs text-red-500">(-0.84%)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400 gap-1 mt-2">
            <RefreshCw size={12} /> Last updated: {currentTime}
          </div>
        </div>
      </header>

      <main className="pt-[140px] pb-28 px-4 space-y-4" style={{ paddingBottom: 'max(100px, calc(24px + env(safe-area-inset-bottom)))' }}>
        
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Good morning, sureshkumar</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h2>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-gray-700" />
                
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#22c55e" 
                  strokeWidth="12" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={animated ? mfOffset : circumference} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="12" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={animated ? npsOffset : circumference} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out delay-300"
                  transform="rotate(-90 50 50)"
                />
                
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="12" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={animated ? fdOffset : circumference} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out delay-500"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtCompact(totalCurrent)}</p>
                <p className={`text-sm flex items-center gap-1 ${totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalReturnPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {fmtPct(totalReturnPercent)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Mutual Funds</span>
              <span className="text-xs text-gray-400 ml-auto">{mfAllocation.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">NPS</span>
              <span className="text-xs text-gray-400 ml-auto">{npsAllocation.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">FD</span>
              <span className="text-xs text-gray-400 ml-auto">{fdAllocation.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtCompact(totalInvested)}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtCompact(totalCurrent)}</p>
          </div>
          <div className={`rounded-xl p-4 ${totalProfitLoss >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
            <p className={`text-lg font-bold ${totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{fmtCompact(totalProfitLoss)}
            </p>
            <p className={`text-xs ${totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtPct(totalReturnPercent)}
            </p>
          </div>
        </div>

        {/* Category Cards - FIXED COLORS */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Mutual Funds */}
          {(() => {
            const mfProfit = mfData.currentValue - mfData.investedAmount;
            const isProfit = mfProfit >= 0;
            return (
              <div className={`rounded-xl p-4 border ${isProfit ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isProfit ? <TrendingUp size={16} className="text-green-600 dark:text-green-400" /> : <TrendingDown size={16} className="text-red-600 dark:text-red-400" />}
                  <p className="text-sm text-gray-600 dark:text-gray-300">Mutual Funds</p>
                </div>
                <p className={`text-xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtCompact(mfData.currentValue)}
                </p>
                <p className={`text-xs ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtPct((mfProfit / mfData.investedAmount) * 100 || 0)}
                </p>
              </div>
            );
          })()}
          
          {/* NPS */}
          {(() => {
            const npsCurrent = npsData.schemes.reduce((sum, s) => sum + (s.units * s.nav), 0);
            const npsProfit = npsCurrent - npsData.totalInvested;
            const isProfit = npsProfit >= 0;
            return (
              <div className={`rounded-xl p-4 border ${isProfit ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isProfit ? <Shield size={16} className="text-indigo-600 dark:text-indigo-400" /> : <TrendingDown size={16} className="text-red-600 dark:text-red-400" />}
                  <p className="text-sm text-gray-600 dark:text-gray-300">NPS</p>
                </div>
                <p className={`text-xl font-bold ${isProfit ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtCompact(npsCurrent)}
                </p>
                <p className={`text-xs ${isProfit ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtPct((npsProfit / npsData.totalInvested) * 100 || 0)}
                </p>
              </div>
            );
          })()}
          
          {/* FD */}
          {(() => {
            const fdProfit = fdData.maturityAmount - fdData.principalAmount;
            const isProfit = fdProfit >= 0;
            return (
              <div className={`rounded-xl p-4 border ${isProfit ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isProfit ? <IndianRupee size={16} className="text-orange-600 dark:text-orange-400" /> : <TrendingDown size={16} className="text-red-600 dark:text-red-400" />}
                  <p className="text-sm text-gray-600 dark:text-gray-300">FD</p>
                </div>
                <p className={`text-xl font-bold ${isProfit ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtCompact(fdData.maturityAmount)}
                </p>
                <p className={`text-xs ${isProfit ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtPct((fdProfit / fdData.principalAmount) * 100 || 0)}
                </p>
              </div>
            );
          })()}
          
          {/* Total Return */}
          <div className={`rounded-xl p-4 border ${totalProfitLoss >= 0 ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              {totalProfitLoss >= 0 ? <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" /> : <TrendingDown size={16} className="text-red-600 dark:text-red-400" />}
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Return</p>
            </div>
            <p className={`text-xl font-bold ${totalProfitLoss >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtCompact(totalProfitLoss)}
            </p>
            <p className={`text-xs ${totalProfitLoss >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtPct(totalReturnPercent)}
            </p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 z-40" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center">
          <a href="/" className="flex flex-col items-center gap-1 text-green-500">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </a>
          <a href="/mutual-funds" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <TrendingUp size={20} />
            <span className="text-xs">MF</span>
          </a>
          <a href="/nps" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Shield size={20} />
            <span className="text-xs">NPS</span>
          </a>
          <a href="/fd" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Percent size={20} />
            <span className="text-xs">FD</span>
          </a>
        </div>
      </nav>

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div 
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
              <button 
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
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
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmtCompact(totalCurrent)}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HOLDINGS</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {mfData.currentValue > 0 ? 1 : 0 + npsData.totalInvested > 0 ? 1 : 0 + fdData.principalAmount > 0 ? 1 : 0} items
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Change Password</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">App Theme</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Contact Us</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">App Version</span>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">v2.0</span>
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-colors font-medium"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}