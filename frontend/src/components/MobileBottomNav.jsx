import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Users, PiggyBank, Crown, Landmark } from 'lucide-react';

export default function MobileBottomNav({ user }) {
  const isPro = user?.plan === 'pro';

  const mobileNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Scanner', path: '/scanner', icon: Sparkles, isPro: true },
    { name: 'Splits', path: '/split-bills', icon: Users },
    { name: 'Vaults', path: '/vaults', icon: PiggyBank },
    { name: 'Tax Saver', path: '/tax-saver', icon: Landmark, isPro: true },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-2 py-2 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[10px] font-bold transition-all relative ${
                  isActive
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.isPro && !isPro && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
