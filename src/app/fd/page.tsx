"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2, Edit2, RefreshCw, Home, Shield, Percent, X, Check, ChevronRight, ChevronLeft, AlertCircle, Calendar, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';

interface FD {
  id: string;
  bankName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  interestEarned: number;
  status: 'Active' | 'Matured' | 'Broken';
  createdAt: string;
}

export default function FDPage() {
  const [fds, setFds] = useState<FD[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingFd, setEditingFd] = useState<FD | null>(null);
  
  const [bankName, setBankName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const [maturityDate, setMaturityDate] = useState('');
  const [maturityAmount, setMaturityAmount] = useState('');
  const [interestEarned, setInterestEarned] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fd_portfolio');
      if (saved) setFds(JSON.parse(saved));
    } catch (e) { console.error('Load error:', e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('fd_portfolio', JSON.stringify(fds));
    window.dispatchEvent(new Event('storage'));
  }, [fds]);

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

  const totalInvested = fds.reduce((sum, fd) => sum + fd.principalAmount, 0);
  const totalCurrentValue = fds.reduce((sum, fd) => sum + fd.maturityAmount, 0);
  const totalInterestEarned = fds.reduce((sum, fd) => sum + fd.interestEarned, 0);
  const totalReturnPercent = totalInvested > 0 ? (totalInterestEarned / totalInvested) * 100 : 0;

  const calculateFD = (principal: number, rate: number, months: number, start: string) => {
    const years = months / 12;
    const quarterlyRate = rate / 4 / 100;
    const quarters = years * 4;
    
    const maturity = principal * Math.pow(1 + quarterlyRate, quarters);
    const interest = maturity - principal;
    
    const startDt = new Date(start);
    const maturityDt = new Date(startDt);
    maturityDt.setMonth(maturityDt.getMonth() + months);
    
    return {
      maturityAmount: maturity,
      interestEarned: interest,
      maturityDate: maturityDt.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    if (principalAmount && interestRate && tenureMonths && startDate) {
      const principal = parseFloat(principalAmount);
      const rate = parseFloat(interestRate);
      const months = parseFloat(tenureMonths);
      
      const result = calculateFD(principal, rate, months, startDate);
      setMaturityDate(result.maturityDate);
      setMaturityAmount(result.maturityAmount.toFixed(2));
      setInterestEarned(result.interestEarned.toFixed(2));
    } else {
      setMaturityDate('');
      setMaturityAmount('');
      setInterestEarned('');
    }
  }, [principalAmount, interestRate, tenureMonths, startDate]);

  const canProceedStep1 = bankName.trim() && principalAmount && parseFloat(principalAmount) > 0;
  const canProceedStep2 = interestRate && parseFloat(interestRate) > 0 && tenureMonths && parseFloat(tenureMonths) > 0;
  const canProceedStep3 = startDate && maturityDate && maturityAmount;

  const openModal = (fd: FD | null = null) => {
    setEditingFd(fd);
    setCurrentStep(1);
    setError(null);
    setMessage(null);
    
    if (fd) {
      setBankName(fd.bankName);
      setPrincipalAmount(fd.principalAmount.toString());
      setInterestRate(fd.interestRate.toString());
      setTenureMonths(fd.tenureMonths.toString());
      setStartDate(fd.startDate);
      setMaturityDate(fd.maturityDate);
      setMaturityAmount(fd.maturityAmount.toString());
      setInterestEarned(fd.interestEarned.toString());
    } else {
      setBankName('');
      setPrincipalAmount('');
      setInterestRate('');
      setTenureMonths('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setMaturityDate('');
      setMaturityAmount('');
      setInterestEarned('');
    }
    
    setShowModal(true);
  };

  const handleSave = () => {
    if (!canProceedStep3) {
      setError('Please complete all steps');
      return;
    }

    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);
    const months = parseFloat(tenureMonths);
    const result = calculateFD(principal, rate, months, startDate);

    const today = new Date().toISOString().split('T')[0];
    const isMatured = maturityDate <= today;

    const fdData: FD = {
      id: editingFd?.id || Date.now().toString(),
      bankName: bankName.trim(),
      principalAmount: principal,
      interestRate: rate,
      tenureMonths: months,
      startDate,
      maturityDate: result.maturityDate,
      maturityAmount: result.maturityAmount,
      interestEarned: result.interestEarned,
      status: isMatured ? 'Matured' : 'Active',
      createdAt: editingFd?.createdAt || new Date().toISOString(),
    };

    if (editingFd) {
      setFds(prev => prev.map(fd => fd.id === editingFd.id ? fdData : fd));
      setMessage('FD updated successfully!');
    } else {
      setFds(prev => [...prev, fdData]);
      setMessage('FD added successfully!');
    }

    setLoading(false);
    setShowModal(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this FD?')) {
      setFds(prev => prev.filter(fd => fd.id !== id));
      setMessage('FD deleted');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtMonths = (m: number) => {
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Matured': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }
  };

  const isMatured = (maturityDate: string) => new Date(maturityDate) <= new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowProfile(true)} className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center hover:bg-orange-600 transition-colors">
                <IndianRupee className="text-white" size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold">MY FD</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fds.length} {fds.length === 1 ? 'FD' : 'FDs'} tracked
                </p>
              </div>
            </div>
            <button onClick={() => openModal(null)} className="p-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors">
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

        {fds.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="text-orange-600 dark:text-orange-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No FDs Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Add your first Fixed Deposit to track maturity and returns</p>
            <button onClick={() => openModal(null)} className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
              <Plus size={18} /> Add Your First FD
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Invested</p>
                <p className="text-lg font-bold">{fmtMoney(totalInvested)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Maturity Value</p>
                <p className="text-lg font-bold">{fmtMoney(totalCurrentValue)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Return</p>
                <p className={`text-lg font-bold ${totalReturnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtPct(totalReturnPercent)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Interest Earned</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmtMoney(totalInterestEarned)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {fds.map((fd) => {
                const matured = isMatured(fd.maturityDate);
                const daysLeft = matured ? 0 : Math.ceil((new Date(fd.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={fd.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                          <IndianRupee className="text-orange-600 dark:text-orange-400" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{fd.bankName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fmtMonths(fd.tenureMonths)} • {fd.interestRate}% p.a.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fd.status)}`}>
                          {fd.status}
                        </span>
                        <button onClick={() => openModal(fd)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(fd.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Principal</p>
                        <p className="font-medium text-gray-900 dark:text-white">{fmtMoney(fd.principalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Maturity Amount</p>
                        <p className="font-medium text-green-600 dark:text-green-400">{fmtMoney(fd.maturityAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">{fmtDate(fd.startDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Maturity Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">{fmtDate(fd.maturityDate)}</p>
                      </div>
                      <div className="col-span-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Interest Earned</p>
                            <p className="font-medium text-green-600 dark:text-green-400">+{fmtMoney(fd.interestEarned)}</p>
                          </div>
                          {!matured && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Days Left</p>
                              <p className="font-medium text-orange-600 dark:text-orange-400">{daysLeft} days</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          <Link href="/nps" className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Shield size={20} />
            <span className="text-xs">NPS</span>
          </Link>
          <Link href="/fd" className="flex flex-col items-center gap-1 text-orange-500">
            <Percent size={20} />
            <span className="text-xs">FD</span>
          </Link>
        </div>
      </nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} totalAssets={totalCurrentValue} />

      {/* Multi-Step Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingFd ? 'Edit FD' : 'Add New FD'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {currentStep > step ? <Check size={16} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-2 transition-colors ${currentStep > step ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Details</span>
                <span>Terms</span>
                <span>Review</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank / Institution Name</label>
                    <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., SBI, HDFC, ICICI" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deposit Amount (₹)</label>
                    <input type="number" value={principalAmount} onChange={e => setPrincipalAmount(e.target.value)} placeholder="e.g., 50000" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interest Rate (% per annum)</label>
                    <div className="relative">
                      <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="e.g., 7.5" step="0.1" className="w-full p-3 pr-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Current FD rates: 6.5% - 8.5% p.a.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tenure (Months)</label>
                    <input type="number" value={tenureMonths} onChange={e => setTenureMonths(e.target.value)} placeholder="e.g., 12, 24, 60" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <div className="flex gap-2 mt-2">
                      {[12, 24, 36, 60].map(m => (
                        <button key={m} type="button" onClick={() => setTenureMonths(m.toString())} className="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 transition-colors">
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">FD Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Bank</span>
                        <span className="font-medium text-gray-900 dark:text-white">{bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Principal</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmtMoney(parseFloat(principalAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Interest Rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">{interestRate}% p.a.</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Tenure</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmtMonths(parseFloat(tenureMonths))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Start Date</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmtDate(startDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">Maturity Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Maturity Date</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(maturityDate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Interest Earned</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">+{fmtMoney(parseFloat(interestEarned))}</span>
                      </div>
                      <div className="pt-3 border-t border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium text-gray-700 dark:text-gray-300">Maturity Amount</span>
                          <span className="text-xl font-bold text-green-600 dark:text-green-400">{fmtMoney(parseFloat(maturityAmount))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Interest is calculated with quarterly compounding. Actual returns may vary slightly based on bank policies.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1} className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                
                {currentStep < 3 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={(currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSave} disabled={!canProceedStep3} className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Check size={18} />
                    {editingFd ? 'Update FD' : 'Save FD'}
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