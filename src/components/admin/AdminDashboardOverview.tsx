import React from 'react';
import { AdminStats } from '../../types';
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
  History,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardOverviewProps {
  stats: AdminStats | null;
  loading: boolean;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ stats, loading }) => {
  if (loading || !stats) {
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
      value: `${stats.total_payouts.toLocaleString()} BIF`,
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
      value: `${(stats.total_wallet_balance || 0).toLocaleString()} BIF`,
      subtext: 'Combined user wallet liabilities',
      icon: Wallet,
      color: 'from-emerald-600 to-cyan-600',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Registration Bonus',
      value: `${(stats.registration_bonus || 15000).toLocaleString()} BIF`,
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
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Admin System Overview</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
          Real-time metrics, user statistics, wallet balances, and system activity logs.
        </p>
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

      {/* Recent Activities Section */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Recent Activities Log</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Real-time system feed</span>
        </div>

        {stats.recent_activities && stats.recent_activities.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {stats.recent_activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-xl text-white ${
                      act.type === 'user'
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {act.type === 'user' ? <Users className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{act.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{act.description}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No recent activity logged yet.</p>
        )}
      </div>
    </div>
  );
};
