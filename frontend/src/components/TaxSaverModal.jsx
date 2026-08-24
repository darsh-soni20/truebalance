import React, { useState } from 'react';
import { X, ShieldCheck, Landmark, CheckCircle, Percent, Info, Sparkles, TrendingUp } from 'lucide-react';

export default function TaxSaverModal({ onClose, expenses }) {
  const [elss, setElss] = useState(50000);
  const [ppf, setPpf] = useState(30000);
  const [healthInsurance, setHealthInsurance] = useState(15000);
  const [nps, setNps] = useState(20000);
  const [termInsurance, setTermInsurance] = useState(10000);

  // Section 80C Limit (Max ₹1.5 Lakh)
  const total80C = Math.min(150000, parseFloat(elss || 0) + parseFloat(ppf || 0) + parseFloat(termInsurance || 0));
  const remaining80C = Math.max(0, 150000 - total80C);

  // Section 80D Limit (Max ₹25,000 for self, ₹50,000 max)
  const total80D = Math.min(25000, parseFloat(healthInsurance || 0));

  // Section 80CCD(1B) NPS (Max ₹50,000 extra)
  const totalNPS = Math.min(50000, parseFloat(nps || 0));

  const totalDeductions = total80C + total80D + totalNPS;
  const estimatedTaxSaved = Math.round(totalDeductions * 0.208); // 20% slab + 4% cess estimate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tax Saver AI Assistant 🇮🇳</h2>
              <p className="text-xs text-gray-400">Section 80C, 80D & 80CCD Tax Savings Estimator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Tax Savings Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-center space-y-1">
          <span className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Estimated Annual Income Tax Saved</span>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{estimatedTaxSaved.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Based on total claimed deductions of <span className="font-bold text-gray-900 dark:text-white">₹{totalDeductions.toLocaleString('en-IN')}</span></p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          
          {/* Section 80C */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  Section 80C Investments
                </span>

                {/* Section 80C Hover Info Button */}
                <div className="relative group cursor-pointer inline-flex items-center">
                  <Info className="w-4 h-4 text-emerald-500 hover:text-emerald-600 transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 space-y-1">
                    <p className="font-bold text-emerald-400">Section 80C Info ℹ️</p>
                    <p className="text-[11px] leading-relaxed">
                      Allows deductions up to <strong>₹1.5 Lakh</strong>/year for investments in ELSS Mutual Funds, PPF, EPF, Term Insurance, Tax Saver FDs, & Children Tuition Fees.
                    </p>
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ₹{total80C.toLocaleString('en-IN')} / ₹1,50,000
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">ELSS Mutual Funds (₹)</label>
                <input
                  type="number"
                  value={elss}
                  onChange={(e) => setElss(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">PPF / EPF Savings (₹)</label>
                <input
                  type="number"
                  value={ppf}
                  onChange={(e) => setPpf(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Term Insurance (₹)</label>
                <input
                  type="number"
                  value={termInsurance}
                  onChange={(e) => setTermInsurance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {remaining80C > 0 && (
              <p className="text-xs text-amber-500 font-medium pt-1">
                💡 Tip: You can invest ₹{remaining80C.toLocaleString('en-IN')} more in ELSS or Tax-Saving FD to max out Section 80C!
              </p>
            )}
          </div>

          {/* Section 80D & 80CCD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Section 80D */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    Section 80D (Health Insurance)
                  </span>

                  {/* Hover Info Tooltip */}
                  <div className="relative group cursor-pointer inline-flex items-center">
                    <Info className="w-3.5 h-3.5 text-teal-500 hover:text-teal-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 space-y-1">
                      <p className="font-bold text-teal-400">Section 80D Info ℹ️</p>
                      <p className="text-[11px] leading-relaxed">
                        Claim up to <strong>₹25,000</strong> for self/family & up to <strong>₹50,000</strong> for senior citizen parents' health insurance premiums + ₹5,000 preventive checkups.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="number"
                value={healthInsurance}
                onChange={(e) => setHealthInsurance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-gray-400 block">Deduction claimed: ₹{total80D.toLocaleString('en-IN')} (Max ₹25,000)</span>
            </div>

            {/* Section 80CCD(1B) */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    Section 80CCD(1B) (NPS)
                  </span>

                  {/* Hover Info Tooltip */}
                  <div className="relative group cursor-pointer inline-flex items-center">
                    <Info className="w-3.5 h-3.5 text-indigo-500 hover:text-indigo-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 space-y-1">
                      <p className="font-bold text-indigo-400">Section 80CCD(1B) Info ℹ️</p>
                      <p className="text-[11px] leading-relaxed">
                        Additional tax deduction up to <strong>₹50,000</strong> for voluntary contributions to National Pension System (NPS). Over and above the 80C limit!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="number"
                value={nps}
                onChange={(e) => setNps(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-gray-400 block">Extra Deduction: ₹{totalNPS.toLocaleString('en-IN')} (Max ₹50,000)</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
