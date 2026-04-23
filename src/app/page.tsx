"use client";
import { TrendingUp, TrendingDown, RefreshCw, Home, Shield, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState('');
  const [animated, setAnimated] = useState(false);

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
    // Trigger animation on mount
    setAnimated(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">MutualTrack</h1>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  sureshkumar
                </p>
              </div>
            </div>
            <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Nifty 50 Card Only */}
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
            <RefreshCw size={12} /> Last updated: {currentTime} PM
          </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="pt-[180px] pb-24 px-4" style={{ paddingBottom: 'max(24px, calc(24px + env(safe-area-inset-bottom)))' }}>
        <div className="space-y-4">
          {/* Greeting */}
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Good morning, sureshkumar</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h2>
          </div>

          {/* Animated Donut Chart Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-gray-700" />
                  
                  {/* Green Segment - Animated */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="12" 
                    strokeDasharray="188.5" 
                    strokeDashoffset={animated ? "0" : "188.5"} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  
                  {/* Purple Segment - Animated */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="12" 
                    strokeDasharray="188.5" 
                    strokeDashoffset={animated ? "94.25" : "188.5"} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out delay-300"
                  />
                  
                  {/* Orange Segment - Animated */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke="#f59e0b" 
                    strokeWidth="12" 
                    strokeDasharray="188.5" 
                    strokeDashoffset={animated ? "141.375" : "188.5"} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out delay-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹1.42L</p>
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <TrendingUp size={14} /> +4.55%
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Parag Parikh Flexi Cap...</span>
                <span className="text-xs text-gray-400 ml-auto">50%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">UTI Nifty 50 Index Fun...</span>
                <span className="text-xs text-gray-400 ml-auto">30%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">NPS</span>
                <span className="text-xs text-gray-400 ml-auto">20%</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₹1,35,932</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₹1,42,111</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">P&L</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">+₹6,179</p>
              <p className="text-xs text-green-600 dark:text-green-400">+4.55%</p>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-300">Mutual Funds</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">₹1.05L</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 funds</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-gray-600 dark:text-gray-300">NPS</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹36.9K</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 account</p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 z-50" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center">
          <NavIcon icon={<Home size={20} />} label="Home" active />
          <NavIcon icon={<TrendingUp size={20} />} label="Mutual Funds" />
          <NavIcon icon={<Shield size={20} />} label="NPS" />
          <NavIcon icon={<Percent size={20} />} label="FD" />
        </div>
      </nav>
    </div>
  );
}

function NavIcon({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'} transition-colors`}>
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}