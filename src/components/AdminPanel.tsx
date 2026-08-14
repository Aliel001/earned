import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { AdminStats, ImageItem, PaymentSettings, User, WithdrawRequest } from '../types.js';
import { adminApi } from '../services/api.js';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview.js';
import { AdminUsersManagement } from './admin/AdminUsersManagement.js';
import { AdminWithdrawalsManagement } from './admin/AdminWithdrawalsManagement.js';
import { AdminPaymentSettings } from './admin/AdminPaymentSettings.js';
import { AdminAppControl } from './admin/AdminAppControl.js';
import { AdminSecurity } from './admin/AdminSecurity.js';
import {
  LayoutDashboard,
  Users,
  ArrowUpRight,
  CreditCard,
  Sliders,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { logout, darkMode, setDarkMode } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'users' | 'withdrawals' | 'payment-settings' | 'app-control' | 'security'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const areUsersEqual = (prev: User[], next: User[]): boolean => {
    if (!Array.isArray(prev) || !Array.isArray(next)) return false;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
      const a = prev[i];
      const b = next[i];
      if (
        !a || !b ||
        a.id !== b.id ||
        a.status !== b.status ||
        a.username !== b.username ||
        a.phone_number !== b.phone_number ||
        a.phone_country_code !== b.phone_country_code ||
        a.wallet?.balance !== b.wallet?.balance ||
        a.country !== b.country
      ) {
        return false;
      }
    }
    return true;
  };

  const areWithdrawsEqual = (prev: WithdrawRequest[], next: WithdrawRequest[]): boolean => {
    if (!Array.isArray(prev) || !Array.isArray(next)) return false;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
      const a = prev[i];
      const b = next[i];
      if (
        !a || !b ||
        a.id !== b.id ||
        a.status !== b.status ||
        a.amount !== b.amount ||
        a.payment_account !== b.payment_account ||
        a.admin_message !== b.admin_message ||
        a.created_at !== b.created_at
      ) {
        return false;
      }
    }
    return true;
  };

  const areImagesEqual = (prev: ImageItem[], next: ImageItem[]): boolean => {
    if (!Array.isArray(prev) || !Array.isArray(next)) return false;
    if (prev.length !== next.length) return false;
    for (let i = 0; i < prev.length; i++) {
      const a = prev[i];
      const b = next[i];
      if (
        !a || !b ||
        a.id !== b.id ||
        a.user_liked !== b.user_liked ||
        a.likes_count !== b.likes_count ||
        a.active !== b.active ||
        a.reward !== b.reward ||
        a.title !== b.title ||
        a.image_url !== b.image_url
      ) {
        return false;
      }
    }
    return true;
  };

  const loadAllAdminData = useCallback(async (isSilent = false) => {
    try {
      const [sData, uData, wData, pData, iData] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getUsers().catch(() => null),
        adminApi.getWithdraws().catch(() => null),
        adminApi.getSettings().catch(() => null),
        adminApi.getImages().catch(() => null),
      ]);

      if (sData) {
        setStats((prev) => {
          if (!prev) return sData;
          if (
            prev.total_users === sData.total_users &&
            prev.pending_users === sData.pending_users &&
            prev.approved_users === sData.approved_users &&
            prev.total_payouts === sData.total_payouts &&
            prev.pending_withdraws === sData.pending_withdraws &&
            prev.total_wallet_balance === sData.total_wallet_balance &&
            prev.active_images === sData.active_images &&
            prev.total_images === sData.total_images &&
            prev.app_status === sData.app_status &&
            prev.todays_withdrawals === sData.todays_withdrawals &&
            prev.registration_bonus === sData.registration_bonus
          ) {
            return prev;
          }
          return sData;
        });
      }

      if (Array.isArray(uData)) setUsers((prev) => (areUsersEqual(prev, uData) ? prev : uData));
      if (Array.isArray(wData)) setWithdraws((prev) => (areWithdrawsEqual(prev, wData) ? prev : wData));
      if (pData) setPaymentSettings((prev) => (JSON.stringify(prev) === JSON.stringify(pData) ? prev : pData));
      if (Array.isArray(iData) && iData.length > 0) setImages((prev) => (areImagesEqual(prev, iData) ? prev : iData));
    } catch {
      // ignore network errors silently in background
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
    // Real-time polling for admin dashboard every 4 seconds
    const interval = setInterval(() => {
      loadAllAdminData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [loadAllAdminData]);

  interface NavItem {
    id: 'dashboard' | 'users' | 'withdrawals' | 'payment-settings' | 'app-control' | 'security';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const pendingWithdrawsCount = useMemo(
    () => withdraws.filter((w) => w.status === 'pending').length,
    [withdraws]
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard },
      { id: 'users', label: '👥 Users', icon: Users, badge: users.length },
      { id: 'withdrawals', label: '💸 Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawsCount },
      { id: 'payment-settings', label: '⚙ Payment Settings', icon: CreditCard },
      { id: 'app-control', label: '📱 App Control', icon: Sliders },
      { id: 'security', label: '🔒 Admin Security', icon: ShieldCheck },
    ],
    [users.length, pendingWithdrawsCount]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-white/10 flex-col justify-between p-5 shrink-0 min-h-screen sticky top-0 transition-colors duration-300">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 px-2">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg font-black text-xl">
              🦒
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base tracking-tight">TwigaMart</h2>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ADMIN SYSTEM
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveAdminTab(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        item.id === 'withdrawals'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-200/80 dark:border-white/10 pt-4">
          <button
            onClick={toggleDarkMode}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          <button
            onClick={logout}
            className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 p-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-white/10 p-4 sticky top-0 z-40 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🦒</span>
          <div>
            <span className="font-black text-slate-900 dark:text-white text-sm block">TwigaMart</span>
            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">ADMIN CONTROL</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-white/10 p-4 space-y-2 sticky top-[57px] z-30 shadow-2xl animate-fade-in">
          {navItems.map((item) => {
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveAdminTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-950'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={logout}
              className="w-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              ADMINISTRATIVE CONTROL PANEL
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">{(activeAdminTab || '').replace('-', ' ')}</h2>
          </div>

          <button
            onClick={() => loadAllAdminData()}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>

        {/* View Routing */}
        {activeAdminTab === 'dashboard' && (
          <AdminDashboardOverview stats={stats} loading={loading} />
        )}

        {activeAdminTab === 'users' && (
          <AdminUsersManagement users={users} onRefresh={loadAllAdminData} />
        )}

        {activeAdminTab === 'withdrawals' && (
          <AdminWithdrawalsManagement withdraws={withdraws} onRefresh={loadAllAdminData} />
        )}

        {activeAdminTab === 'payment-settings' && (
          <AdminPaymentSettings initialSettings={paymentSettings} onRefresh={loadAllAdminData} />
        )}

        {activeAdminTab === 'app-control' && (
          <AdminAppControl images={images} onRefresh={loadAllAdminData} />
        )}

        {activeAdminTab === 'security' && (
          <AdminSecurity onRefresh={loadAllAdminData} />
        )}
      </main>
    </div>
  );
};
