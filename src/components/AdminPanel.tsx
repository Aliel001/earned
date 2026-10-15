import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  useAdminStats,
  useAdminUsers,
  useAdminWithdrawals,
  useAdminPaymentSettings,
  useAdminImages,
  useAdminMutations,
} from '../hooks/useAdminData.js';
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
  Database,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { logout, darkMode, setDarkMode } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'users' | 'withdrawals' | 'payment-settings' | 'app-control' | 'security'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbHealth, setDbHealth] = useState<{
    connected: boolean;
    host: string;
    db: string;
    isNeon: boolean;
    latencyMs: number;
  } | null>(null);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  // React Query with NO background polling to prevent flickering and ensure single-source-of-truth stability
  const {
    data: stats = null,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useAdminStats();

  const {
    data: users = [],
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    refetch: refetchUsers,
  } = useAdminUsers();

  const {
    data: withdraws = [],
    isLoading: isWithdrawsLoading,
    isFetching: isWithdrawsFetching,
    refetch: refetchWithdraws,
  } = useAdminWithdrawals();

  const {
    data: paymentSettings = null,
    refetch: refetchPaymentSettings,
  } = useAdminPaymentSettings();

  const {
    data: images = [],
    refetch: refetchImages,
  } = useAdminImages();

  const { invalidateAll } = useAdminMutations();

  const isInitialLoading = isStatsLoading && isUsersLoading && isWithdrawsLoading;
  const isAnyFetching = isStatsFetching || isUsersFetching || isWithdrawsFetching;

  // Check Database connection health
  const checkDbHealth = useCallback(async () => {
    try {
      const res = await adminApi.getDbHealth();
      if (res && res.success) {
        setDbHealth({
          connected: res.connected,
          host: res.diagnostics.host,
          db: res.diagnostics.db,
          isNeon: res.diagnostics.isNeon,
          latencyMs: res.latencyMs,
        });
      }
    } catch {
      setDbHealth({
        connected: false,
        host: 'Unknown',
        db: 'Unknown',
        isNeon: false,
        latencyMs: -1,
      });
    }
  }, []);

  useEffect(() => {
    checkDbHealth();
  }, [checkDbHealth]);

  // Unified explicit refresh function passed to child components
  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchUsers(),
      refetchWithdraws(),
      refetchPaymentSettings(),
      refetchImages(),
      invalidateAll(),
      checkDbHealth(),
    ]);
  }, [refetchStats, refetchUsers, refetchWithdraws, refetchPaymentSettings, refetchImages, invalidateAll, checkDbHealth]);

  interface NavItem {
    id: 'dashboard' | 'users' | 'withdrawals' | 'payment-settings' | 'app-control' | 'security';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const safeWithdraws = useMemo(() => (Array.isArray(withdraws) ? withdraws : []), [withdraws]);
  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const safeImages = useMemo(() => (Array.isArray(images) ? images : []), [images]);

  const pendingWithdrawsCount = useMemo(
    () => safeWithdraws.filter((w) => w && w.status === 'pending').length,
    [safeWithdraws]
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'dashboard', label: '📊 Dashboard', icon: LayoutDashboard },
      { id: 'users', label: '👥 Users', icon: Users, badge: safeUsers.length },
      { id: 'withdrawals', label: '💸 Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawsCount },
      { id: 'payment-settings', label: '⚙ Payment Settings', icon: CreditCard },
      { id: 'app-control', label: '📱 App Control', icon: Sliders },
      { id: 'security', label: '🔒 Admin Security', icon: ShieldCheck },
    ],
    [safeUsers.length, pendingWithdrawsCount]
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
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ADMIN SYSTEM
                </span>
              </div>
            </div>
          </div>

          {/* Database Connection Status Badge */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">PostgreSQL</span>
              </div>
              {dbHealth?.connected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  ONLINE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500">
                  <AlertCircle className="w-3 h-3" />
                  CONNECTING
                </span>
              )}
            </div>
            {dbHealth && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Host: <span className="font-mono">{dbHealth.host}</span>
                {dbHealth.latencyMs >= 0 && (
                  <span className="ml-1 text-slate-400">({dbHealth.latencyMs}ms)</span>
                )}
              </div>
            )}
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
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                ADMINISTRATIVE CONTROL PANEL
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                <Database className="w-3 h-3" />
                PostgreSQL Direct
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white capitalize">{(activeAdminTab || '').replace('-', ' ')}</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveAdminTab('security')}
              className={`p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer ${
                activeAdminTab === 'security'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40'
              }`}
              title="Hindura Password ya Admin muri Database"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Password</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isAnyFetching}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm active:scale-95 cursor-pointer"
              title="Refresh Data Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnyFetching ? 'animate-spin text-emerald-500' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* View Routing */}
        {activeAdminTab === 'dashboard' && (
          <AdminDashboardOverview
            stats={stats}
            loading={isInitialLoading}
            onNavigateTab={setActiveAdminTab}
          />
        )}

        {activeAdminTab === 'users' && (
          <AdminUsersManagement users={safeUsers} onRefresh={handleManualRefresh} />
        )}

        {activeAdminTab === 'withdrawals' && (
          <AdminWithdrawalsManagement withdraws={safeWithdraws} onRefresh={handleManualRefresh} />
        )}

        {activeAdminTab === 'payment-settings' && (
          <AdminPaymentSettings initialSettings={paymentSettings} onRefresh={handleManualRefresh} />
        )}

        {activeAdminTab === 'app-control' && (
          <AdminAppControl images={safeImages} onRefresh={handleManualRefresh} />
        )}

        {activeAdminTab === 'security' && (
          <AdminSecurity onRefresh={handleManualRefresh} />
        )}
      </main>
    </div>
  );
};
