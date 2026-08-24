import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, ArrowLeft, Check, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { API_BASE } from '../api';

export default function SplitBillsPage({ user, token }) {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [splitTitle, setSplitTitle] = useState('');
  const [splitTotal, setSplitTotal] = useState('');
  const [splitPeople, setSplitPeople] = useState('2');
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchSplits();
  }, []);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const fetchSplits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/splits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setSplits(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddSplit = async (e) => {
    e.preventDefault();
    if (!splitTitle || !splitTotal || parseFloat(splitTotal) <= 0) return;

    try {
      const total = parseFloat(splitTotal);
      const count = parseInt(splitPeople, 10) || 2;
      const perPerson = total / count;

      const res = await fetch(`${API_BASE}/api/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: splitTitle, total_amount: total, split_count: count, per_person: perPerson })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bill split');

      setSplits([data, ...splits]);
      setSplitTitle('');
      setSplitTotal('');
      setSplitPeople('2');
      triggerConfetti();
      setStatus({ type: 'success', msg: 'Bill split created successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  const handleDeleteSplit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/splits/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSplits(splits.filter((s) => s.id !== id));
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Split Bills with Friends</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Split group dinners, vacation expenses, and cabs with equal per-person shares</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create Bill Split Form */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">Create New Bill Split</h2>

          {status.msg && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleAddSplit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Bill Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Dinner with Friends, Goa Trip Cab..."
                value={splitTitle}
                onChange={(e) => setSplitTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Bill Amount (₹)</label>
              <input
                type="number"
                step="1"
                required
                placeholder="1200"
                value={splitTotal}
                onChange={(e) => setSplitTotal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Number of People</label>
              <input
                type="number"
                min="2"
                required
                value={splitPeople}
                onChange={(e) => setSplitPeople(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {splitTotal && parseFloat(splitTotal) > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Each Person Pays: ₹{(parseFloat(splitTotal) / (parseInt(splitPeople, 10) || 2)).toFixed(2)}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Create Bill Split
            </button>
          </form>
        </div>

        {/* Existing Bill Splits List */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">
            Active Group Bill Splits ({splits.length})
          </h2>

          {splits.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
              <p className="text-xs font-medium">No bill splits created yet. Add a split above to track group balances!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {splits.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[150px]">{s.title}</span>
                    <button onClick={() => handleDeleteSplit(s.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Total Bill</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{s.total_amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Split Between</span>
                      <span className="font-semibold text-amber-500">{s.split_count} People</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-400">Per Person Share</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{s.per_person.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
