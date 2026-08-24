import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, Trash2, ArrowLeft, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { API_BASE } from '../api';

export default function SavingsVaultsPage({ user, token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchGoals();
  }, []);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setGoals(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    try {
      const res = await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: goalTitle, target_amount: goalTarget, saved_amount: goalSaved || 0, deadline_date: goalDeadline })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add goal');

      setGoals([data, ...goals]);
      setGoalTitle('');
      setGoalTarget('');
      setGoalSaved('');
      setGoalDeadline('');
      triggerConfetti();
      setStatus({ type: 'success', msg: 'Savings Goal / Vault created!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  const handleDepositGoal = async (id) => {
    const amountStr = prompt('Enter deposit amount (₹):', '1000');
    if (!amountStr || parseFloat(amountStr) <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}/deposit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addAmount: amountStr })
      });

      const updated = await res.json();
      if (res.ok) {
        setGoals(goals.map((g) => (g.id === id ? updated : g)));
        triggerConfetti();
      }
    } catch (err) {}
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Vaults & Financial Goals</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set targets for Goa trips, emergency funds, or new gadgets and track progress</p>
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
        
        {/* Create Savings Goal Form */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">Create New Savings Vault</h2>

          {status.msg && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Goal Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Goa Trip 🌴, New Laptop 💻, Emergency Fund 🛡️"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Target Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="15000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Initial Saved Amount (₹)</label>
              <input
                type="number"
                placeholder="2000"
                value={goalSaved}
                onChange={(e) => setGoalSaved(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Target Deadline Date (Optional)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              Create Savings Vault
            </button>
          </form>
        </div>

        {/* Existing Savings Goals List */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">
            Active Savings Vaults ({goals.length})
          </h2>

          {goals.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <PiggyBank className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
              <p className="text-xs font-medium">No savings goals created yet. Set a goal above to start building your savings!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const pct = Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100);
                return (
                  <div key={g.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        {g.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          ₹{g.saved_amount.toLocaleString('en-IN')} / ₹{g.target_amount.toLocaleString('en-IN')} ({pct}%)
                        </span>
                        <button onClick={() => handleDeleteGoal(g.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-400">{g.deadline_date ? `Deadline: ${g.deadline_date}` : 'No deadline set'}</span>
                      <button
                        onClick={() => handleDepositGoal(g.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs cursor-pointer transition-colors"
                      >
                        + Add Savings Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
