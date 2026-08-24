import React, { useState } from 'react';
import { Landmark, ArrowLeft, Info, Check, ShieldCheck, Sparkles, Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProUpgradeModal from '../components/ProUpgradeModal';

export default function TaxSaverPage({ user, token, onUserUpdated }) {
  const [income, setIncome] = useState('950000');
  const [sec80c, setSec80c] = useState('150000');
  const [sec80d, setSec80d] = useState('25000');
  const [nps, setNps] = useState('50000');
  const [showProModal, setShowProModal] = useState(false);

  const isPro = user?.plan === 'pro';

  const incomeVal = parseFloat(income) || 0;
  const cVal = Math.min(parseFloat(sec80c) || 0, 150000);
  const dVal = Math.min(parseFloat(sec80d) || 0, 75000);
  const npsVal = Math.min(parseFloat(nps) || 0, 50000);

  const totalDeductions = cVal + dVal + npsVal;
  const taxableIncomeOld = Math.max(0, incomeVal - 50000 - totalDeductions); // Standard deduction ₹50,000

  let oldTax = 0;
  if (taxableIncomeOld > 1000000) {
    oldTax = 112500 + (taxableIncomeOld - 1000000) * 0.3;
  } else if (taxableIncomeOld > 500000) {
    oldTax = 12500 + (taxableIncomeOld - 500000) * 0.2;
  } else if (taxableIncomeOld > 250000) {
    oldTax = (taxableIncomeOld - 250000) * 0.05;
  }

  const taxableIncomeNew = Math.max(0, incomeVal - 75000);
  let newTax = 0;
  if (taxableIncomeNew > 1500000) {
    newTax = 150000 + (taxableIncomeNew - 1500000) * 0.3;
  } else if (taxableIncomeNew > 1200000) {
    newTax = 90000 + (taxableIncomeNew - 1200000) * 0.2;
  } else if (taxableIncomeNew > 900000) {
    newTax = 45000 + (taxableIncomeNew - 900000) * 0.15;
  } else if (taxableIncomeNew > 600000) {
    newTax = 15000 + (taxableIncomeNew - 600000) * 0.1;
  } else if (taxableIncomeNew > 300000) {
    newTax = (taxableIncomeNew - 300000) * 0.05;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Saver AI Assistant 🇮🇳</h1>
              {!isPro && <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-xs">PRO 🔒</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Section 80C, 80D, and 80CCD tax deduction optimizer & Regime comparison (Old vs New)</p>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* PRO Feature Banner Guard for FREE users */}
      {!isPro ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white w-fit mx-auto shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tax Saver AI Assistant is a PRO Feature 👑</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Upgrade to TrueBalance PRO to optimize Section 80C, 80D & 80CCD deductions, compare Old vs New tax regimes, and calculate exact tax savings.
            </p>
          </div>
          <button
            onClick={() => setShowProModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-amber-500/25 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to TrueBalance PRO 👑 (1-Click Test)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Tax Inputs Form */}
          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">Your Annual Income & Tax Deductions</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Gross Annual Income (₹)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Section 80C */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section 80C Investments (Max ₹1,50,000)</label>
                  <div className="relative group">
                    <button type="button" className="text-teal-500 cursor-pointer p-0.5"><Info className="w-3.5 h-3.5" /></button>
                    <div className="absolute right-0 bottom-6 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-[11px] rounded-xl shadow-xl z-30">
                      Includes ELSS Mutual Funds, PPF, EPF, Life Insurance Premiums, & School Tuition Fees.
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={sec80c}
                  onChange={(e) => setSec80c(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Section 80D */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section 80D Health Insurance (Max ₹75,000)</label>
                  <div className="relative group">
                    <button type="button" className="text-teal-500 cursor-pointer p-0.5"><Info className="w-3.5 h-3.5" /></button>
                    <div className="absolute right-0 bottom-6 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-[11px] rounded-xl shadow-xl z-30">
                      Health Insurance premiums for Self, Family (₹25k) & Senior Citizen Parents (₹50k).
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={sec80d}
                  onChange={(e) => setSec80d(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Section 80CCD(1B) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section 80CCD(1B) NPS (Max ₹50,000)</label>
                  <div className="relative group">
                    <button type="button" className="text-teal-500 cursor-pointer p-0.5"><Info className="w-3.5 h-3.5" /></button>
                    <div className="absolute right-0 bottom-6 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-[11px] rounded-xl shadow-xl z-30">
                      Additional ₹50,000 tax deduction for contribution to National Pension System (NPS).
                    </div>
                  </div>
                </div>
                <input
                  type="number"
                  value={nps}
                  onChange={(e) => setNps(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Tax Comparison & Advisor Results */}
          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">Tax Regime Comparison & Recommendation</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Old Tax Regime</span>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{Math.round(oldTax).toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-gray-400 block">Includes ₹{totalDeductions.toLocaleString('en-IN')} in 80C/80D/NPS deductions</span>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">New Tax Regime</span>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{Math.round(newTax).toLocaleString('en-IN')}</div>
                <span className="text-[10px] text-gray-400 block">Includes Standard Deduction ₹75,000</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">AI Recommendation</h3>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                {oldTax < newTax
                  ? `💡 The Old Tax Regime saves you ₹${Math.round(newTax - oldTax).toLocaleString('en-IN')} more in taxes because of your 80C, 80D & NPS investments!`
                  : `💡 The New Tax Regime saves you ₹${Math.round(oldTax - newTax).toLocaleString('en-IN')} more in taxes due to lower slab rates & ₹75,000 standard deduction!`}
              </p>
            </div>
          </div>

        </div>
      )}

      {showProModal && (
        <ProUpgradeModal
          user={user}
          token={token}
          onClose={() => setShowProModal(false)}
          onUserUpdated={onUserUpdated}
        />
      )}

    </div>
  );
}
