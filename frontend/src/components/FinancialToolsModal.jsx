import React, { useState } from 'react';
import { X, Calculator, Percent, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';

export default function FinancialToolsModal({ onClose }) {
  const [tool, setTool] = useState('emi'); // 'emi' | 'fd'

  // EMI State
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureMonths, setTenureMonths] = useState(60);

  // FD State
  const [depositAmount, setDepositAmount] = useState(100000);
  const [fdRate, setFdRate] = useState(7.2);
  const [fdYears, setFdYears] = useState(3);

  const calculateEMI = () => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = parseInt(tenureMonths) || 1;
    if (P <= 0 || r <= 0 || n <= 0) return { emi: 0, monthlyInterest: 0, totalPayable: 0, totalInterest: 0 };

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;
    const monthlyInterest = totalInterest / n;

    return {
      emi: emi.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      monthlyInterest: monthlyInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      totalPayable: totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      totalInterest: totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    };
  };

  const calculateFD = () => {
    const P = parseFloat(depositAmount) || 0;
    const r = (parseFloat(fdRate) || 0) / 100;
    const t = parseFloat(fdYears) || 0;

    const maturity = P * Math.pow(1 + r, t);
    const profit = maturity - P;
    const monthlyReturn = profit / (t * 12 || 1);

    return {
      maturity: maturity.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      profit: profit.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      monthlyReturn: monthlyReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    };
  };

  const emiResult = calculateEMI();
  const fdResult = calculateFD();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Financial Calculators</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setTool('emi')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              tool === 'emi'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Loan EMI Calculator
          </button>
          <button
            onClick={() => setTool('fd')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              tool === 'fd'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Fixed Deposit / Savings Calculator
          </button>
        </div>

        {tool === 'emi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Tenure (Months)
                </label>
                <input
                  type="number"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Results Grid with Monthly Interest Included */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
              <div>
                <span className="text-xs text-gray-400 uppercase block">Monthly EMI</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{emiResult.emi}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase block">Monthly Interest</span>
                <span className="text-lg font-bold text-amber-500">₹{emiResult.monthlyInterest}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase block">Total Interest</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">₹{emiResult.totalInterest}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase block">Total Amount</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">₹{emiResult.totalPayable}</span>
              </div>
            </div>
          </div>
        )}

        {tool === 'fd' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Annual Interest (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={fdRate}
                  onChange={(e) => setFdRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Tenure (Years)
                </label>
                <input
                  type="number"
                  value={fdYears}
                  onChange={(e) => setFdYears(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <div>
                <span className="text-xs text-gray-400 uppercase block">Monthly Interest</span>
                <span className="text-lg font-bold text-amber-500">₹{fdResult.monthlyReturn}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase block">Total Profit</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{fdResult.profit}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase block">Maturity Value</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">₹{fdResult.maturity}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
