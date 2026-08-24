import React, { useState } from 'react';
import { Calculator, ArrowLeft, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CalculatorsPage() {
  const [calcTab, setCalcTab] = useState('emi'); // 'emi' | 'fd'

  // EMI State
  const [loanAmount, setLoanAmount] = useState('500000');
  const [interestRate, setInterestRate] = useState('9.5');
  const [tenureYears, setTenureYears] = useState('5');

  // FD State
  const [fdPrincipal, setFdPrincipal] = useState('100000');
  const [fdRate, setFdRate] = useState('7.1');
  const [fdYears, setFdYears] = useState('3');

  // EMI Calc Logic
  const p = parseFloat(loanAmount) || 0;
  const r = (parseFloat(interestRate) || 0) / 12 / 100;
  const n = (parseFloat(tenureYears) || 0) * 12;
  const emiVal = n > 0 && r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
  const totalEmiPayment = emiVal * n;
  const totalEmiInterest = totalEmiPayment - p;

  // FD Calc Logic
  const fdP = parseFloat(fdPrincipal) || 0;
  const fdR = (parseFloat(fdRate) || 0) / 100;
  const fdT = parseFloat(fdYears) || 0;
  const fdMaturity = fdP * Math.pow(1 + fdR / 4, 4 * fdT); // Quarterly compounding
  const fdInterest = fdMaturity - fdP;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Financial Calculators</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculate Loan EMIs, Fixed Deposit (FD) returns, and investment growth</p>
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

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 rounded-2xl max-w-md mx-auto text-xs font-bold shadow-sm">
        <button
          onClick={() => setCalcTab('emi')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${calcTab === 'emi' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Loan EMI Calculator 🏦
        </button>
        <button
          onClick={() => setCalcTab('fd')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${calcTab === 'fd' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Fixed Deposit (FD) 📈
        </button>
      </div>

      {calcTab === 'emi' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">EMI Inputs</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Loan Amount (₹)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">Monthly EMI Breakdown</h2>

            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Monthly EMI Payable</span>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{Math.round(emiVal).toLocaleString('en-IN')}</div>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Principal Amount</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{p.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Total Interest Payable</span>
                <span className="font-bold text-red-500">₹{Math.round(totalEmiInterest).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Total Amount Payable</span>
                <span className="font-extrabold text-gray-900 dark:text-white">₹{Math.round(totalEmiPayment).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">FD Inputs</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Deposit Principal (₹)</label>
              <input
                type="number"
                value={fdPrincipal}
                onChange={(e) => setFdPrincipal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={fdRate}
                onChange={(e) => setFdRate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={fdYears}
                onChange={(e) => setFdYears(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">FD Maturity Breakdown</h2>

            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Maturity Value</span>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">₹{Math.round(fdMaturity).toLocaleString('en-IN')}</div>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-400">Principal Deposit</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{fdP.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Total Interest Earned</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">+₹{Math.round(fdInterest).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
