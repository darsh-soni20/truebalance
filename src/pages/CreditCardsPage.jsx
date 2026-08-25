import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { API_BASE } from '../api';

export default function CreditCardsPage({ user, token }) {
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [cardName, setCardName] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardStatement, setCardStatement] = useState('');
  const [cardMinDue, setCardMinDue] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const fetchCreditCards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setCreditCards(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!cardName || !cardDueDate || !cardStatement) return;

    try {
      const res = await fetch(`${API_BASE}/api/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ card_name: cardName, due_date: cardDueDate, statement_amount: cardStatement, min_due: cardMinDue || 0 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add credit card');

      setCreditCards([...creditCards, data]);
      setCardName('');
      setCardDueDate('');
      setCardStatement('');
      setCardMinDue('');
      triggerConfetti();
      setStatus({ type: 'success', msg: 'Credit Card Bill added to tracking!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  const handlePayCard = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards/${id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setCreditCards(creditCards.map((c) => (c.id === id ? { ...c, status: 'paid' } : c)));
        triggerConfetti();
      }
    } catch (err) {}
  };

  const handleDeleteCard = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCreditCards(creditCards.filter((c) => c.id !== id));
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credit Cards & Bills Manager</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track due dates, minimum dues, and total statements for HDFC, ICICI, SBI & Axis cards</p>
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
        
        {/* Track Card Bill Form */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">Track New Card Bill</h2>

          {status.msg && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleAddCard} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Card Name / Bank</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Regalia 💳, ICICI Amazon Pay"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Statement Total Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="14500"
                value={cardStatement}
                onChange={(e) => setCardStatement(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={cardDueDate}
                  onChange={(e) => setCardDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Minimum Due (₹)</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={cardMinDue}
                  onChange={(e) => setCardMinDue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Track Credit Card Bill
            </button>
          </form>
        </div>

        {/* Existing Credit Cards List */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">
            Tracked Credit Card Bills ({creditCards.length})
          </h2>

          {creditCards.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
              <p className="text-xs font-medium">No credit card bills tracked yet. Add your card bill above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {creditCards.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-white block">{c.card_name}</span>
                    <span className="text-xs text-gray-400">Due Date: {c.due_date}</span>
                    {c.min_due > 0 && <span className="text-xs text-amber-500 block">Min Due: ₹{c.min_due.toLocaleString('en-IN')}</span>}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-base text-gray-900 dark:text-white">₹{c.statement_amount.toLocaleString('en-IN')}</span>
                    {c.status === 'paid' ? (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayCard(c.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => handleDeleteCard(c.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
