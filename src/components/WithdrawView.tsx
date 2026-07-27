import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaymentSettings, WithdrawRequest } from '../types';
import {
  ArrowUpRight,
  Wallet as WalletIcon,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface WithdrawViewProps {
  balance: number;
  withdrawRequests: WithdrawRequest[];
  paymentSettings: PaymentSettings | null;
  onSubmitWithdraw: (amount: number, account: string) => Promise<void>;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({
  balance,
  withdrawRequests,
  paymentSettings,
  onSubmitWithdraw,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('5000');
  const [paymentAccount, setPaymentAccount] = useState<string>(
    user ? `${user.phone_country_code} ${user.phone_number}` : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 5000) {
      setError('Ingano ya muke yo kwaka ni 5,000 BIF (Minimum withdrawal is 5,000 BIF)');
      return;
    }

    if (numAmount > balance) {
      setError('Nta mafaranga ahagije ari mu gapuri kawe (Insufficient wallet balance)');
      return;
    }

    if (!paymentAccount.trim()) {
      setError('Andika numero ya Lumicash / Ecocash yaboherereza (Payment account required)');
      return;
    }

    setLoading(true);
    try {
      await onSubmitWithdraw(numAmount, paymentAccount.trim());
      setSuccess('Ubusabe bwazamuwe neza! Ubuyobozi buri kubusuzuma.');
      setAmount('5000');
    } catch (err: any) {
      setError(err.message || 'Harabaye ikosa mu kwaka amafaranga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden space-y-3 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-slate-950/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-emerald-300 border border-emerald-400/30">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Kwasaba Ubwisuzume</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-200">BIF Currency</span>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-300">Available Wallet Balance</p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {balance.toLocaleString()} <span className="text-emerald-400 text-lg">BIF</span>
          </h1>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-lg dark:shadow-2xl space-y-4 transition-colors duration-300">
        <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
          <WalletIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>SABA KUBIKUZA (REQUEST WITHDRAWAL)</span>
        </h2>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-3.5 rounded-2xl text-xs font-bold flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ingano y'Amafaranga (Amount in BIF)
            </label>
            <div className="relative">
              <input
                type="number"
                min="5000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-2xl py-3 pl-4 pr-16 text-slate-900 dark:text-white text-sm font-bold focus:outline-none transition"
                placeholder="5000"
                required
              />
              <span className="absolute right-4 top-3 text-xs font-black text-emerald-600 dark:text-emerald-400">
                BIF
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Minimum withdrawal: 5,000 BIF</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Numero ya Lumicash / Ecocash (Payment Account)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-2xl py-3 pl-11 pr-4 text-slate-900 dark:text-white text-sm font-bold focus:outline-none transition"
                placeholder="+257 69001122"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Iri kubikora...</span>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Rungika Ubusabe Bwo Kwaka (Request Payout)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Payment Instructions (Read-only) */}
      {paymentSettings && (
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-lg dark:shadow-2xl space-y-3 transition-colors duration-300">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>PAYMENT INSTRUCTIONS (Uko Kwishyura Bikorwa)</span>
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5">
            {paymentSettings.payment_instructions}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
            <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
              <p className="text-[10px] text-slate-500">WhatsApp Admin</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">{paymentSettings.whatsapp_number}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
              <p className="text-[10px] text-slate-500">USSD Code</p>
              <p className="text-teal-600 dark:text-teal-400 text-xs font-extrabold">{paymentSettings.ussd_code}</p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-lg dark:shadow-2xl space-y-3 transition-colors duration-300">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>URUTONDE RWO KWAKA AMAFARANGA (WITHDRAWAL HISTORY)</span>
        </h3>

        {withdrawRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-medium">
            Nta busabe bwo kwaka amafaranga burakorwa (No withdrawals requested yet).
          </div>
        ) : (
          <div className="space-y-2.5">
            {withdrawRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 p-4 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {req.amount.toLocaleString()} BIF
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                        : req.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  Account: <span className="text-slate-800 dark:text-slate-200">{req.payment_account}</span>
                </p>

                {req.admin_message && (
                  <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-slate-800 dark:text-slate-300 text-[11px] flex items-start space-x-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Admin Message:</span> {req.admin_message}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 text-right">
                  {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
