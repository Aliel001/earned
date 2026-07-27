import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../locales/translations';
import { Home, Image as ImageIcon, Wallet, ArrowUpRight, User as UserIcon, Shield } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { role, language } = useAuth();

  const navItems = [
    { id: 'home', label: t('home', language), icon: Home },
    { id: 'images', label: t('images', language), icon: ImageIcon },
    { id: 'wallet', label: t('wallet', language), icon: Wallet },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 py-2 px-2 shadow-lg dark:shadow-2xl transition-colors duration-300">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 min-w-[50px] min-h-[48px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-bold leading-none">{item.label}</span>

              {isActive && (
                <div className="absolute -bottom-1 w-5 h-1 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
