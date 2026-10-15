import React from 'react';
import { AdminStats } from '../../types.js';
import {
  Users,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Wallet,
  Gift,
  ImageIcon,
  Calendar,
} from 'lucide-react';

interface AdminDashboardOverviewProps {
  stats: AdminStats | null;
  loading: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ stats, loading, onNavigateTab }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-bold text-xs">
        Loading dashboard metrics...
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      subtext: 'Registered accounts in system',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Pending Users',
      value: stats.pending_users.toLocaleString(),
      subtext: 'Awaiting admin approval',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'Approved Users',
      value: stats.approved_users.toLocaleString(),
      subtext: 'Active verified users',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Total Withdrawals',
      value: `${stats.total_payouts.toLocaleString()}`,
      subtext: `${stats.pending_withdraws} pending request(s)`,
      icon: ArrowUpRight,
      color: 'from-rose-500 to-pink-600',
      borderColor: 'border-rose-500/30',
    },
    {
      title: "Today's Withdrawals",
      value: `${stats.todays_withdrawals || 0} Requests`,
      subtext: 'Submitted in last 24 hours',
      icon: Calendar,
      color: 'from-purple-500 to-indigo-600',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Total Wallet Balance',
      value: `${(stats.total_wallet_balance || 0).toLocaleString()}`,
      subtext: 'Combined user wallet liabilities',
      icon: Wallet,
      color: 'from-emerald-600 to-cyan-600',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Registration Bonus',
      value: `${(stats.registration_bonus ?? 0).toLocaleString()}`,
      subtext: 'Welcome bonus per new user',
      icon: Gift,
      color: 'from-teal-500 to-emerald-600',
      borderColor: 'border-teal-500/30',
    },
    {
      title: 'Active Images',
      value: `${stats.active_images || 0} / ${stats.total_images || 0}`,
      subtext: 'Published earning photos',
      icon: ImageIcon,
      color: 'from-sky-500 to-blue-600',
      borderColor: 'border-sky-500/30',
    },
    {
      title: 'Application Status',
      value: stats.app_status === 'maintenance' ? 'MAINTENANCE' : 'ONLINE',
      subtext: stats.app_status === 'maintenance' ? 'User access blocked' : 'All systems operational',
      icon: Activity,
      color: stats.app_status === 'maintenance' ? 'from-amber-500 to-rose-600' : 'from-emerald-500 to-teal-600',
      borderColor: stats.app_status === 'maintenance' ? 'border-amber-500/30' : 'border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Security & Database Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 text-white rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                Umutekano n'Inyandiko y'ibanga ya Admin
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                PostgreSQL
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Urashobora guhindura password yawe n'izina bya Admin igihe cyose ubishakiye, igahita isimbura iyari muri Database.
            </p>
          </div>
        </div>
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('security')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition shrink-0 self-start sm:self-auto cursor-pointer flex items-center space-x-1.5 active:scale-95"
          >
            <span>Hindura Password</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-lg dark:shadow-2xl space-y-3 relative overflow-hidden transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
