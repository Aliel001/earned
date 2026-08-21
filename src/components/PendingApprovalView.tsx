import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { t } from '../locales/translations.js';
import { paymentApi } from '../services/api.js';
import { PaymentSettings } from '../types.js';
import {
  Clock,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Gift,
  Copy,
  Check,
  Info,
  Smartphone,
  CreditCard,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { getPayNowUssdDetails } from '../utils/paymentUtils.js';
import {
  getUserCurrency,
  getCountryFlag,
  getCountryName,
} from '../utils/currency.js';

export const PendingApprovalView: React.FC = () => {
  const { user, language, refreshUser, logout } = useAuth();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await paymentApi.getSettings();
      if (res) setPaymentSettings(res);
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleCheckStatus = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refreshUser]);

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const userCurrency = useMemo(() => getUserCurrency(user), [user]);
  const countryFlag = useMemo(() => getCountryFlag(user?.country, user?.phone_country_code), [user]);
  const countryName = useMemo(() => getCountryName(user?.country, user?.phone_country_code), [user]);

  const isPending = user?.status === 'pending';
  const isRejected = user?.status === 'rejected';
  const isSuspended = user?.status === 'suspended';

  const ussdInfo = useMemo(() => {
    if (!user || !paymentSettings) return null;
    return getPayNowUssdDetails(
      user.phone_country_code,
      paymentSettings.account_number,
      paymentSettings.ussd_code
    );
  }, [user?.phone_country_code, paymentSettings?.account_number, paymentSettings?.ussd_code]);

  if (!user) return null;

  const whatsappMessage = encodeURIComponent(
    `Muraho Admin, nandikishije konte nshya kuri TwigaMart!\n- Izina (Username): @${user.username}\n- Numero: ${user.phone_country_code} ${user.phone_number}\n- Igihugu: ${countryFlag} ${countryName} (${userCurrency})\nNyamuneka mwemeze konte yanjye nkorere amafaranga. Murakoze!`
  );

  return (
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-6 space-y-5 animate-fade-in pb-16">
      {/* Main Status Hero Card */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 text-center shadow-lg dark:shadow-2xl space-y-5 transition-colors duration-300 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon */}
        <div className="relative inline-block mt-1">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300 backdrop-blur-md shadow-inner">
            {isPending && <Clock className="w-10 h-10 animate-pulse text-emerald-600 dark:text-emerald-400" />}
            {isRejected && <ShieldAlert className="w-10 h-10 text-rose-500" />}
            {isSuspended && <ShieldAlert className="w-10 h-10 text-orange-500" />}
          </div>
          <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-white dark:border-slate-950 shadow-lg flex items-center space-x-1">
            <span>15K</span>
            <span className="text-[10px] uppercase">{userCurrency}</span>
          </span>
        </div>

        {/* Title & Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center space-x-2">
            <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-extrabold text-xs uppercase px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
              {isPending && t('status_pending', language)}
              {isRejected && t('status_rejected', language)}
              {isSuspended && t('status_suspended', language)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isPending && t('registration_pending_title', language)}
            {isRejected && 'Konte Yawe Yanzwe (Account Rejected)'}
            {isSuspended && 'Konte Yawe Irahagaritswe (Account Suspended)'}
          </h1>

          {/* User badge summary */}
          <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <span>@{user.username}</span>
            <span>•</span>
            <span>{user.phone_country_code} {user.phone_number}</span>
            <span>•</span>
            <span>{countryFlag} {countryName}</span>
          </div>
        </div>

        {/* Bonus Card */}
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl p-4 text-left space-y-1.5 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-black text-sm">
              <Gift className="w-5 h-5 text-emerald-500 fill-emerald-500/20 shrink-0" />
              <span>{t('welcome_bonus_badge', language, userCurrency)} ({userCurrency})</span>
            </div>
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm">
              +15,000 {userCurrency}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            Agashimwe kawe k'ikaze k'amafaranga <strong>15,000 {userCurrency}</strong> kamaze kubikwa mu gasanduku/gapuri kawe. Uzatangira kuyakoresha no kuyabikuza ukimara kwemerwa n'Ubuyobozi (Admin).
          </p>
        </div>

        {/* Pending Approval Notice */}
        {isPending && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 text-left space-y-2 text-xs backdrop-blur-md">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-black text-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{t('notice_pending_approval', language)}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              {t('notice_pending_desc', language)}
            </p>
          </div>
        )}
      </div>

      {/* AMABWIRIZA Y'UBWISHYU (PAYMENT & PAYOUT INSTRUCTIONS COMPONENT) */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-lg dark:shadow-2xl space-y-5 transition-colors duration-300">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {t('payment_payout_instructions_title', language)}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t('payment_payout_instructions_desc', language)}
            </p>
          </div>
        </div>

        {/* 1. Account Activation Payment Guide */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>{t('activation_payment_guide_title', language)}</span>
          </div>

          {/* Account Number Details */}
          {paymentSettings?.account_number && (
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Numero y'Ubwishyu ya Admin</p>
                <p className="font-mono font-black text-sm text-slate-900 dark:text-emerald-400">
                  {paymentSettings.account_number}
                </p>
              </div>
              <button
                onClick={() => handleCopy(paymentSettings.account_number, 'account')}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
              >
                {copiedItem === 'account' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Yakopewe!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiya</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* USSD Shortcode Details */}
          {ussdInfo && (
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ikode ya USSD (Direct Dial)</p>
                <p className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                  {ussdInfo.ussdDisplay}
                </p>
              </div>
              <button
                onClick={() => handleCopy(ussdInfo.ussdDisplay, 'ussd')}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
              >
                {copiedItem === 'ussd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                    <span>Yakopewe!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiya</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Pay Now Button */}
          {ussdInfo && (
            <a
              href={ussdInfo.telDialUrl}
              className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-between text-xs active:scale-95"
            >
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>PAY NOW ({ussdInfo.ussdDisplay})</span>
              </div>
              <span className="bg-slate-950 text-amber-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-amber-300/40">
                {ussdInfo.isRwanda ? '🇷🇼 MTN / Airtel' : `${countryFlag} Direct`}
              </span>
            </a>
          )}
        </div>

        {/* 2. Custom Admin Payment & Payout Instructions */}
        {paymentSettings?.payment_instructions && paymentSettings.payment_instructions.trim().length > 0 && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{t('admin_instructions_title', language)}</span>
            </div>
            <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium text-[11px] bg-white/70 dark:bg-slate-950/70 p-3 rounded-xl border border-amber-500/20">
              {paymentSettings.payment_instructions}
            </div>
          </div>
        )}

        {/* 3. Payout & Withdraw Guide */}
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span>{t('payout_guide_title', language)}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
            {t('payout_guide_desc', language, userCurrency)}
          </p>
        </div>

        {/* Direct WhatsApp Contact Button */}
        {paymentSettings?.whatsapp_number && (
          <div className="pt-1">
            <a
              href={`https://wa.me/${paymentSettings.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2.5 text-xs active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950/20" />
              <span>{t('contact_admin', language)} (WhatsApp)</span>
            </a>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS (Check Status & Logout) */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 shadow-lg flex items-center justify-between text-xs transition-colors">
        <button
          onClick={logout}
          className="text-xs text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 font-bold transition px-2 py-1"
        >
          {t('logout', language)}
        </button>

        <button
          onClick={handleCheckStatus}
          disabled={isRefreshing}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md transition disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{t('check_status', language)}</span>
        </button>
      </div>
    </div>
  );
};
