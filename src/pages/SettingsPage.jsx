import React, { useState } from 'react';
import { Settings, User, Mail, Lock, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, Key, Eye, EyeOff, Smartphone, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api';

export default function SettingsPage({ user, token, onUserUpdated }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [monthlyBudget, setMonthlyBudget] = useState(user.monthly_budget || 25000);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Security PIN State
  const [pinEnabled, setPinEnabled] = useState(localStorage.getItem('tb_pin_enabled') === 'true');
  const [pinCode, setPinCode] = useState(localStorage.getItem('tb_security_pin') || '1234');
  const [privacyMode, setPrivacyMode] = useState(localStorage.getItem('tb_privacy_mode') === 'true');

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'mobile'
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    setLoading(true);

    const budgetVal = parseFloat(monthlyBudget) > 0 ? parseFloat(monthlyBudget) : 25000;

    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, monthly_budget: budgetVal })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403 || data.error?.includes('token')) {
          const userKey = user?.id || user?.email || 'default_user';
          localStorage.setItem(`truebalance_budget_val_${userKey}`, budgetVal.toString());
          if (typeof onUserUpdated === 'function') onUserUpdated({ ...user, name, email, monthly_budget: budgetVal });
          setStatus({ type: 'success', msg: 'Monthly spending budget saved locally! (Sign in again to sync across devices)' });
          return;
        }
        throw new Error(data.error || 'Failed to update profile');
      }

      setStatus({ type: 'success', msg: 'Profile & monthly spending budget saved!' });
      if (typeof onUserUpdated === 'function') onUserUpdated(data);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setStatus({ type: 'success', msg: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurityPin = (e) => {
    e.preventDefault();
    if (pinCode.length !== 4) return alert('PIN must be exactly 4 digits');

    localStorage.setItem('tb_pin_enabled', pinEnabled ? 'true' : 'false');
    localStorage.setItem('tb_security_pin', pinCode);
    localStorage.setItem('tb_privacy_mode', privacyMode ? 'true' : 'false');

    setStatus({ type: 'success', msg: 'Security PIN & Privacy settings updated!' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile, Security & App Settings</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage profile, 4-digit PIN lock, privacy mode, and Android mobile app packaging</p>
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

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl text-xs font-semibold max-w-md">
          <button
            onClick={() => { setActiveTab('profile'); setStatus({ type: '', msg: '' }); }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Profile & Budget
          </button>
          <button
            onClick={() => { setActiveTab('security'); setStatus({ type: '', msg: '' }); }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Security PIN & Lock
          </button>
          <button
            onClick={() => { setActiveTab('mobile'); setStatus({ type: '', msg: '' }); }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Mobile & APK
          </button>
        </div>

        {status.msg && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{status.msg}</span>
          </div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Monthly Spending Limit / Budget (₹)
              </label>
              <div className="relative">
                <span className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="500"
                  required
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile & Budget'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleSaveSecurityPin} className="space-y-6 max-w-lg">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white block">Enable 4-Digit App PIN Lock 🔐</span>
                  <span className="text-xs text-gray-400">Prompts for PIN lock when opening TrueBalance</span>
                </div>
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {pinEnabled && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Set 4-Digit PIN Code</label>
                  <input
                    type="password"
                    maxLength="4"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-32 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white block">Privacy Mode (Mask Balances) 👁️</span>
                <span className="text-xs text-gray-400">Masks sensitive rupee amounts (`₹••••••`) on dashboard</span>
              </div>
              <input
                type="checkbox"
                checked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Save Security & PIN Settings
            </button>
          </form>
        )}

        {activeTab === 'mobile' && (
          <div className="space-y-6 max-w-lg">
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Mobile App & Android APK Setup 📱</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                TrueBalance is fully mobile responsive! You can install it on your Android phone or iPhone in 2 ways:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">Option 1: PWA Instant Installation (Zero APK Download)</span>
                  <p className="text-gray-500 dark:text-gray-400">Open <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">http://[Your-PC-IP]:3000</code> in Chrome/Safari on your phone, tap Chrome Menu (⋮) or Share button, and select <strong>"Add to Home Screen"</strong>!</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Option 2: Native Android .APK Build (Capacitor)</span>
                  <p className="text-gray-500 dark:text-gray-400">Run <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">npx cap add android</code> and <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">npx cap open android</code> in your terminal to build native APK via Android Studio!</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
