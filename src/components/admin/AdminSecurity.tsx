import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import { ShieldCheck, Lock, User, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminSecurityProps {
  onRefresh?: () => void;
}

export const AdminSecurity: React.FC<AdminSecurityProps> = ({ onRefresh }) => {
  const [currentUsername, setCurrentUsername] = useState('admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Shyiramo inyandiko y\'ibanga ya none (Current password is required)');
      return;
    }

    if (!newPassword) {
      setError('Shyiramo inyandiko y\'ibanga inshya (New password is required)');
      return;
    }

    if (newPassword.length < 6) {
      setError('Inyandiko y\'ibanga inshya igomba kuba ifite inyuguti nibura 6 (Min 6 characters)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Inyandiko z\'ibanga zombi ntizihuye (New passwords do not match)');
      return;
    }

    setLoading(true);

    try {
      const res = await adminApi.changeAdminPassword({
        currentPassword,
        newPassword,
        newUsername: currentUsername.trim() || undefined,
      });

      setSuccess(res.message || 'Inyandiko y\'ibanga n\'izina bya Admin byahinduwe neza!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setError(err.message || 'Harabaye ikosa mu guhindura inyandiko y\'ibanga ya Admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Admin Access & Security
            </span>
            <h2 className="text-xl font-black text-white mt-1">Umutekano wa Admin (Admin Security)</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Hindura inyandiko y'ibanga (Password) cyangwa izina ry'admin hano kugira ngo urinde konte y'ubuyobozi.
            </p>
          </div>
        </div>
      </div>

      {/* Security Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl space-y-6 transition-colors duration-300">
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Izina rya Admin (Admin Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Izina ukoresha uyingira nka Admin (urashobora korigumana nka 'admin').
            </p>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Inyandiko y'ibanga ya none (Current Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Inyandiko y'ibanga inshya (New Password) *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Nyamuneka ikore igire nibura inyuguti 6.</p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Emeza inyandiko y'ibanga inshya (Confirm New Password) *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm mt-4"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Bika Impinduka za Security (Save Password)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
