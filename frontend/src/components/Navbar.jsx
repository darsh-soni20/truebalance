import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User, Settings, Calculator, Landmark, Menu, X, Users, Sparkles, PiggyBank, CreditCard, LayoutDashboard, Crown, ChevronDown, Filter } from 'lucide-react';
import ProUpgradeModal from './ProUpgradeModal';

export default function Navbar({ user, token, onLogout, darkMode, setDarkMode, onUserUpdated }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const isPro = user?.plan === 'pro';

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Scanner', path: '/scanner', icon: Sparkles, isPro: true },
    { name: 'Group Splits', path: '/split-bills', icon: Users, isPro: false },
    { name: 'Savings Vaults', path: '/vaults', icon: PiggyBank, isPro: false },
    { name: 'Credit Cards', path: '/cards', icon: CreditCard, isPro: false },
    { name: 'Tax Saver', path: '/tax-saver', icon: Landmark, isPro: true },
    { name: 'Calculators', path: '/calculators', icon: Calculator, isPro: false },
  ];

  return (
    <>
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* TrueBalance Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src={darkMode ? "/assets/logo_dark.png" : "/assets/logo_light.png"}
                alt="TrueBalance Logo"
                className="h-16 sm:h-20 max-w-[260px] object-contain transition-all drop-shadow-sm cursor-pointer"
              />
            </Link>

            {/* Clean Filter Dropdown Menu (Only Filter Option in Navbar) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <Filter className="w-4 h-4 text-emerald-500" />
                  <span>Navigate Features</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Filter Dropdown Items */}
                {filterDropdownOpen && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in space-y-1">
                    {navLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setFilterDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-emerald-500" />
                            <span>{item.name}</span>
                          </div>
                          {item.isPro && !isPro && <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">PRO</span>}
                        </button>
                      );
                    })}

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button
                        onClick={() => {
                          setShowProModal(true);
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>{isPro ? 'Premium Member 👑' : 'Upgrade PRO 👑'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Navigation Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>

              {user && (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer relative"
                  title="Menu"
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Hamburger Dropdown Drawer Menu */}
        {menuOpen && user && (
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl animate-fade-in py-4 px-6 space-y-3">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</span>
                    <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase ${isPro ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                      {isPro ? 'PRO 👑' : 'FREE 🆓'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 block">{user.email}</span>
                </div>
              </div>

              <button
                onClick={() => { setShowProModal(true); setMenuOpen(false); }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isPro ? 'PRO Member' : 'Upgrade PRO'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-emerald-500" />
                      <span>{item.name}</span>
                    </div>
                    {item.isPro && !isPro && <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">PRO 🔒</span>}
                  </NavLink>
                );
              })}

              <button
                onClick={() => { setShowProModal(true); setMenuOpen(false); }}
                className="flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Premium 👑 Status & Plans</span>
                </div>
              </button>

              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Settings className="w-4 h-4 text-emerald-500" />
                <span>Profile & Settings</span>
              </NavLink>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { onLogout(); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        )}

      </nav>

      {/* Pro Upgrade Modal */}
      {showProModal && (
        <ProUpgradeModal
          user={user}
          token={token}
          onClose={() => setShowProModal(false)}
          onUserUpdated={onUserUpdated}
        />
      )}
    </>
  );
}
