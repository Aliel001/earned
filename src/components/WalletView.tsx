import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../locales/translations';
import { PaymentSettings, WithdrawRequest } from '../types';
import { Wallet, ArrowUpRight, Copy, Check, Clock, CheckCircle2, XCircle, Phone, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { getPayNowUssdDetails } from '../utils/paymentUtils';

interface WalletViewProps {
  balance: number;
  withdrawRequests: WithdrawRequest[];
  paymentSettings: PaymentSettings | null;
  onSubmitWithdraw: (amount: number, paymentAccount: string) => Promise<void>;
}

export const WalletView: React.FC<WalletViewProps> = ({
  balance,
  withdrawRequests,
  paymentSettings,
  onSubmitWithdraw,
}) => {
  const { language, user } = useAuth();

  const [amount, setAmount] = useState<string>('5000');
  const [paymentAccount, setPaymentAccount] = useState<string>(
    user ? `${user.phone_country_code} ${user.phone_number}` : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 5000) {
      setError(t('min_withdraw_note', language));
      return;
    }

    if (numAmount > balance) {
      setError('Amafaranga ashobora gusabwa arenze ayo ufise mu gapuri.');
      return;
    }

    if (!paymentAccount.trim()) {
      setError('Andika numero ya Lumicash / Ecocash.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitWithdraw(numAmount, paymentAccount);
      setAmount('5000');
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-100">
              {t('wallet_title', language)}
            </span>
          </div>
          <span className="bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-400/30 text-xs font-black px-3 py-1 rounded-full uppercase">
            BIF Currency
          </span>
        </div>

        <div className="mt-2 relative z-10">
          <p className="text-xs font-semibold text-emerald-100/90">{t('current_balance', language)}</p>
          <p className="text-4xl font-black tracking-tight text-white mt-1">
            {balance.toLocaleString()} <span className="text-xl font-bold text-emerald-200">BIF</span>
          </p>
        </div>
      </div>

      {/* Withdraw Form Card */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg dark:shadow-2xl transition-colors duration-300">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('withdraw_title', language)}</span>
        </h2>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-3 rounded-xl text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('withdraw_amount', language)}
            </label>
            <input
              type="number"
              min="5000"
              step="500"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('min_withdraw_note', language)}</p>
          </div>

          {/* Payment Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('payment_account_number', language)}
            </label>
            <input
              type="text"
              required
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              placeholder="+257 69 11 22 33"
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || balance < 5000}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{t('submit_withdraw', language)}</span>
            )}
          </button>
        </form>
      </div>

      {/* Payment Settings & Instructions Card */}
      {paymentSettings && (() => {
        const ussdInfo = getPayNowUssdDetails(
          user?.phone_country_code,
          paymentSettings.account_number,
          paymentSettings.ussd_code
        );

        return (
          <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="w-4 h-4" />
                <span>{t('payment_methods_instructions', language)}</span>
              </h3>

              <a
                href={ussdInfo.telDialUrl}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-1.5 rounded-full text-xs shadow-lg flex items-center space-x-1.5 transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 fill-slate-950" />
                <span>PAY NOW ({ussdInfo.isRwanda ? '🇷🇼' : '🇧🇮'})</span>
              </a>
            </div>

            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-3 text-xs">
              {/* Pay Now Phone Call Button Banner */}
              <a
                href={ussdInfo.telDialUrl}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black p-3 rounded-xl flex items-center justify-between shadow-lg transition active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 fill-slate-950 animate-bounce" />
                  <span className="text-xs uppercase font-extrabold">PAY NOW USSD ({ussdInfo.ussdDisplay})</span>
                </div>
                <span className="bg-slate-950 text-amber-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg border border-amber-300/40">
                  {ussdInfo.cleanAdminNumber}
                </span>
              </a>

              {/* USSD Code Copy */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{t('ussd_code_label', language)}</p>
                  <p className="font-extrabold text-amber-300 text-sm tracking-wider">{ussdInfo.ussdDisplay}</p>
                </div>
                <button
                  onClick={() => handleCopyCode(ussdInfo.ussdDisplay)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 transition text-xs backdrop-blur-md"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? t('code_copied', language) : t('copy_code', language)}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed pt-2 border-t border-white/10">
                {paymentSettings.payment_instructions}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Withdrawal Request History */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg dark:shadow-2xl transition-colors duration-300">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('withdraw_history', language)}</span>
        </h2>

        {withdrawRequests.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">{t('no_withdrawals', language)}</p>
        ) : (
          <div className="space-y-3">
            {withdrawRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {req.amount.toLocaleString()} BIF
                    </span>
                    <p className="text-[10px] text-slate-400">{req.payment_account}</p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : req.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {req.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {req.status === 'pending' && <Clock className="w-3 h-3" />}
                    <span className="uppercase">{req.status}</span>
                  </span>
                </div>

                {/* Date */}
                <p className="text-[10px] text-slate-500">
                  {new Date(req.created_at).toLocaleString()}
                </p>

                {/* Admin Message Display */}
                {req.admin_message && (
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2.5 text-[11px] text-amber-300 space-y-0.5">
                    <p className="font-bold text-[10px] uppercase text-amber-400">
                      {t('admin_message_label', language)}:
                    </p>
                    <p className="italic">"{req.admin_message}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
