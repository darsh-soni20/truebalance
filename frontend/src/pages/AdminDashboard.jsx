import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Trash2, Crown, Sparkles, UserCheck, Search, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../api';

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all'); // 'all' | 'free' | 'pro'

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch admin stats');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}" and all their account data?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete user');
      fetchAdminStats();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400 font-semibold text-sm">
        Loading TrueBalance Admin Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl text-center text-sm font-semibold">
        {error}
      </div>
    );
  }

  const filteredUsers = (stats?.users || []).filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === 'all' || (filterPlan === 'pro' ? u.plan === 'pro' : u.plan !== 'pro');
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              TrueBalance Admin Control Center 🛡️
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform user directory, tier distribution (FREE vs PRO 👑), and user account management</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Registered Users</p>
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* FREE Tier Users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Basic FREE Plan Users 🆓</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{stats.freeUsers}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>

        {/* PRO Tier Users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Premium PRO Members 👑</p>
            <h3 className="text-3xl font-extrabold text-amber-500 mt-2">{stats.proUsers}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 shadow-sm">
            <Crown className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* Users Directory Table Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Registered Users Directory</h2>
            <p className="text-xs text-gray-400">View user subscription details, plan status, and monthly spending budgets</p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="free">FREE Plan 🆓</option>
              <option value="pro">PRO Plan 👑</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No registered users found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">User Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Monthly Budget</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                      {u.name}
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-mono">
                      {u.email}
                    </td>
                    <td className="py-4 px-4">
                      {u.plan === 'pro' ? (
                        <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-[10px] uppercase shadow-sm shadow-amber-500/20 inline-flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>PRO Tier 👑</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[10px] uppercase">
                          FREE Plan 🆓
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{parseFloat(u.monthly_budget || 25000).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
