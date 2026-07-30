import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { t } from '../locales/translations.js';
import { ImageItem, PaymentSettings } from '../types.js';
import { Wallet, Image as ImageIcon, Heart, ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles, MessageSquare, PhoneCall, Zap, PhoneForwarded } from 'lucide-react';
import { getPayNowUssdDetails } from '../utils/paymentUtils.js';

interface HomeDashboardProps {
  balance: number;
  images: ImageItem[];
  paymentSettings: PaymentSettings | null;
  onLikeImage: (imageId: string) => void;
  onNavigate: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  balance,
  images,
  paymentSettings,
  onLikeImage,
  onNavigate,
}) => {
  const { user, language } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const safeImages = Array.isArray(images) ? images : [];
  const totalLikes = safeImages.filter((img) => img && img.user_liked).length;
  const activeImages = safeImages.filter((img) => img && img.active);

  const handleLikeWithToast = async (imageId: string) => {
    onLikeImage(imageId);
    setToastMessage('+1,000 BIF yiyongereye mu gapuri kawe! 🎉');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const ussdInfo = getPayNowUssdDetails(
    user?.phone_country_code,
    paymentSettings?.account_number,
    paymentSettings?.ussd_code
  );

  return (
    <div className="space-y-5 pb-8 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-full shadow-2xl border-2 border-slate-950 flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Welcome & Account Status Card */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl relative overflow-hidden space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Muraho, Mwiriwe!</p>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>@{user?.username}</span>
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </h1>
          </div>
          <div className="flex items-center space-x-1 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('status_approved', language)}</span>
          </div>
        </div>

        {/* Balance Display Emerald Frosted Block */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-800 border border-white/20 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-emerald-950/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-100 mb-0.5">
              {t('current_balance', language)}
            </p>
            <p className="text-3xl font-black text-white tracking-tight">
              {balance.toLocaleString()} <span className="text-lg font-extrabold text-emerald-200">BIF</span>
            </p>
            <p className="text-[10px] text-emerald-200 mt-1 font-semibold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Buri like 1 = +1,000 BIF mu gapuri</span>
            </p>
          </div>

          <button
            onClick={() => onNavigate('wallet')}
            className="relative z-10 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 text-xs flex items-center space-x-1.5 transition active:scale-95"
          >
            <span>{t('withdraw_btn', language)}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PAY NOW / Phone Call Button Banner for Users */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-5 text-slate-950 shadow-2xl relative overflow-hidden space-y-3 border border-amber-300/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-slate-950/90 text-amber-400 font-black text-[11px] px-3 py-1 rounded-full border border-amber-400/40 uppercase">
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>PAY NOW / ISHYURA SANGO</span>
          </div>
          <span className="text-xs font-black bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40">
            {ussdInfo.isRwanda ? '🇷🇼 RWANDA USSD' : '🇧🇮 BURUNDI USSD'}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950 tracking-tight leading-tight">
            Kora Kwikora no Kwishyura mu Kanda Hano!
          </h2>
          <p className="text-xs font-bold text-slate-900/90 mt-1">
            Kanda Kuri "PAY NOW" Uhita Ufungura Telefone Kuri USSD Code Za Mobile Money / Lumicash.
          </p>
        </div>

        {/* Display Phone Numbers & USSD Code */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              USSD Code ({ussdInfo.isRwanda ? 'MTN / Airtel RW' : 'Lumicash / Ecocash BI'})
            </p>
            <p className="font-black text-amber-300 tracking-wider text-sm">{ussdInfo.ussdDisplay}</p>
          </div>
          <div className="text-[10px] bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-400/30 font-bold">
            {ussdInfo.cleanAdminNumber}
          </div>
        </div>

        {/* Big Action Pay Now USSD Direct Phone Call Button */}
        <a
          href={ussdInfo.telDialUrl}
          className="w-full bg-slate-950 hover:bg-slate-900 text-amber-400 font-black py-3.5 px-4 rounded-2xl shadow-xl border border-amber-400/50 flex items-center justify-center space-x-2.5 text-sm transition active:scale-95"
        >
          <PhoneForwarded className="w-5 h-5 text-amber-400 animate-bounce" />
          <span>PAY NOW ({ussdInfo.ussdDisplay})</span>
        </a>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex items-center space-x-3 shadow-md dark:shadow-lg transition-colors">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('available_images', language)}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{activeImages.length}</p>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex items-center space-x-3 shadow-md dark:shadow-lg transition-colors">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
            <Heart className="w-5 h-5 fill-rose-500/20" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('total_likes', language)}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{totalLikes}</p>
          </div>
        </div>
      </div>

      {/* Available Images Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('available_images', language)}</span>
          </h2>
          <button
            onClick={() => onNavigate('images')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Bona Zose →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeImages.slice(0, 4).map((image) => (
            <div
              key={image.id}
              className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-md dark:shadow-lg flex flex-col justify-between hover:border-emerald-500/40 transition"
            >
              <div className="relative aspect-square bg-slate-900 overflow-hidden group">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-black text-xs px-2.5 py-1 rounded-full shadow">
                  +{image.reward.toLocaleString()} BIF
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{image.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {image.likes_count || 0} {t('total_likes', language)}
                  </p>
                </div>

                <button
                  onClick={() => handleLikeWithToast(image.id)}
                  disabled={image.user_liked}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shrink-0 ${
                    image.user_liked
                      ? 'bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-white/10 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/20 active:scale-95'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${image.user_liked ? 'fill-slate-400' : 'fill-white'}`} />
                  <span>{image.user_liked ? t('liked', language) : t('like_btn', language)}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Settings & Direct Contact Callout */}
      {paymentSettings && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('payment_methods_instructions', language)}</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href={`https://wa.me/${paymentSettings.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 backdrop-blur-md transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>

            <a
              href={ussdInfo.telDialUrl}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 p-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 backdrop-blur-md transition"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Call Direct ({ussdInfo.cleanAdminNumber})</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

