import React, { useState, useEffect } from 'react';
import { Users, Receipt, ShieldCheck, Trash2 } from 'lucide-react';
import { API_BASE } from '../api';

export default function AdminDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (!confirm(`Are you sure you want to delete user "${userName}" and all their expense data?`)) return;

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
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        Loading Admin Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Control Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and user management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Registered Users</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses Logged */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Expenses Logged</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalExpenses}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Aggregate Volume */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Aggregate Platform Spend</p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
              ₹{stats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold text-xl">
            ₹
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Registered Users Directory</h2>

        {stats.users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No regular users registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4">Expenses Logged</th>
                  <th className="py-3.5 px-4">Total Spend</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">
                      {u.name}
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                      {u.email}
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                        {u.expenseCount} entries
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900 dark:text-white">
                      ₹{u.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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
