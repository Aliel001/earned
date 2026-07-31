import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { t } from '../locales/translations.js';
import { paymentApi } from '../services/api.js';
import { PaymentSettings } from '../types.js';
import { Clock, PhoneCall, MessageSquare, RefreshCw, ShieldAlert, Gift, CheckCircle2 } from 'lucide-react';
import { getPayNowUssdDetails } from '../utils/paymentUtils.js';

export const PendingApprovalView: React.FC = () => {
  const { user, language, refreshUser, logout } = useAuth();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    paymentApi.getSettings().then(setPaymentSettings).catch(console.error);
  }, []);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (!user) return null;

  const isPending = user.status === 'pending';
  const isRejected = user.status === 'rejected';
  const isSuspended = user.status === 'suspended';

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 text-center shadow-lg dark:shadow-2xl space-y-6 transition-colors duration-300">
        {/* Header Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300 backdrop-blur-md">
            {isPending && <Clock className="w-10 h-10 animate-pulse text-emerald-600 dark:text-emerald-400" />}
            {isRejected && <ShieldAlert className="w-10 h-10 text-rose-500" />}
            {isSuspended && <ShieldAlert className="w-10 h-10 text-orange-500" />}
          </div>
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-white dark:border-slate-950 shadow-lg">
            15K BIF
          </span>
        </div>

        {/* Title & Status */}
        <div>
          <span className="inline-block bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 font-bold text-xs uppercase px-3 py-1 rounded-full mb-3 backdrop-blur-md">
            {isPending && t('status_pending', language)}
            {isRejected && t('status_rejected', language)}
            {isSuspended && t('status_suspended', language)}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isPending && t('registration_pending_title', language)}
            {isRejected && 'Konte Yawe Yanzwe (Account Rejected)'}
            {isSuspended && 'Konte Yawe Irahagaritswe (Account Suspended)'}
          </h2>
        </div>

        {/* Bonus Card */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-500/20 dark:via-teal-500/15 dark:to-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 text-left space-y-1 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
            <Gift className="w-4 h-4" />
            <span>Bonus y\'Ikaze (Welcome Bonus): 15,000 BIF</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Amafaranga 15,000 BIF y\'agashimwe gataramo yabitswe mu gapuri kawe. Uzotangura kuyakoresha cyangwa kuyasaba heza kwemerwa.
          </p>
        </div>

        {/* Registration Success & Pending Approval Notification Card */}
        {isPending && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-left space-y-2 text-xs backdrop-blur-md">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
              <span>ITANGAZO: Konte Irindiriye Kwemerwa (Pending Approval)</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              Urakoze kwiyandikisha! Konte yawe yaremewe neza. Nyamuneka tegereza ko Ubuyobozi (Admin) buyemeza ("gutegereza admin approval"). 
              Ukimara kwemerwa, utangira gukora amafaranga no kubikuza.
            </p>
          </div>
        )}

        {/* Contact Admin Actions */}
        {paymentSettings && (() => {
          const ussdInfo = getPayNowUssdDetails(
            user.phone_country_code,
            paymentSettings.account_number,
            paymentSettings.ussd_code
          );

          return (
            <div className="space-y-2.5 pt-2">
              {/* Pay Now Direct USSD Dial */}
              <a
                href={ussdInfo.telDialUrl}
                className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-xl transition flex items-center justify-between text-xs active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <PhoneCall className="w-4 h-4 text-slate-950 animate-bounce" />
                  <span>PAY NOW ({ussdInfo.ussdDisplay})</span>
                </div>
                <span className="bg-slate-950 text-amber-300 font-extrabold text-[11px] px-2 py-0.5 rounded-md border border-amber-300/40">
                  {ussdInfo.isRwanda ? '🇷🇼 MTN/Airtel' : '🇧🇮 Lumicash'}
                </span>
              </a>

              {/* WhatsApp Link */}
              <a
                href={`https://wa.me/${(paymentSettings?.whatsapp_number || '').replace(/\D/g, '')}?text=Muraho%20Admin%2C%20nabyaza%20konte%20yange%20kuri%20TwigaMart%20(${encodeURIComponent(
                  user?.username || ''
                )})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2.5 text-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('contact_admin', language)} (WhatsApp)</span>
              </a>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-400 font-medium transition"
          >
            {t('logout', language)}
          </button>

          <button
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t('check_status', language)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
