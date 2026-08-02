import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Header } from './Header.js';
import { BottomNav } from './BottomNav.js';
import { AuthModal } from './AuthModal.js';
import { PendingApprovalView } from './PendingApprovalView.js';
import { HomeDashboard } from './HomeDashboard.js';
import { ImagesGallery } from './ImagesGallery.js';
import { WalletView } from './WalletView.js';
import { WithdrawView } from './WithdrawView.js';
import { ProfileView } from './ProfileView.js';
import { PWAInstallBanner } from './PWAInstallBanner.js';
import { imagesApi, notificationsApi, paymentApi, walletApi, withdrawApi } from '../services/api.js';
import { ImageItem, NotificationItem, PaymentSettings, Wallet, WithdrawRequest } from '../types.js';
import { t } from '../locales/translations.js';
import { Gift, ArrowRight, Heart, Wallet as WalletIcon } from 'lucide-react';

export const UserLayout: React.FC = () => {
  const { user, language } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/images')) return 'images';
    if (path.startsWith('/wallet')) return 'wallet';
    if (path.startsWith('/withdraw')) return 'withdraw';
    if (path.startsWith('/profile') || path.startsWith('/menu')) return 'profile';
    return 'home';
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const [images, setImages] = useState<ImageItem[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [, setNotifications] = useState<NotificationItem[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    let targetPath = '/';
    if (tab === 'images') targetPath = '/images';
    else if (tab === 'wallet') targetPath = '/wallet';
    else if (tab === 'withdraw') targetPath = '/withdraw';
    else if (tab === 'profile') targetPath = '/profile';
    else targetPath = '/';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const loadData = async () => {
    if (!user) {
      paymentApi.getSettings().then(setPaymentSettings).catch(console.error);
      imagesApi.getImages().then((res) => setImages(Array.isArray(res) ? res : [])).catch(console.error);
      return;
    }

    try {
      const [imgRes, wallRes, wdrRes, notifRes, payRes] = await Promise.all([
        imagesApi.getImages().catch(() => []),
        walletApi.getWallet().catch(() => null),
        withdrawApi.getHistory().catch(() => []),
        notificationsApi.getNotifications().catch(() => []),
        paymentApi.getSettings().catch(() => null),
      ]);

      setImages(Array.isArray(imgRes) ? imgRes : []);
      setWallet(wallRes);
      setWithdrawRequests(Array.isArray(wdrRes) ? wdrRes : []);
      setNotifications(Array.isArray(notifRes) ? notifRes : []);
      setPaymentSettings(payRes);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time background sync every 2 seconds
    const interval = setInterval(() => {
      loadData();
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLikeImage = async (imageId: string) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }

    const res = await imagesApi.likeImage(imageId);
    if (res.success) {
      setWallet((prev) => (prev ? { ...prev, balance: res.new_balance } : null));
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, user_liked: true, likes_count: (img.likes_count || 0) + 1 }
            : img
        )
      );
      notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    }
  };

  const handleSubmitWithdraw = async (amount: number, paymentAccount: string) => {
    const res = await withdrawApi.submit(amount, paymentAccount);
    if (res.withdraw) {
      setWithdrawRequests((prev) => [res.withdraw, ...prev]);
      const updatedWallet = await walletApi.getWallet();
      setWallet(updatedWallet);
      notificationsApi.getNotifications().then(setNotifications).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-20 relative overflow-x-hidden transition-colors duration-300">
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onOpenAuth={handleOpenAuth} walletBalance={wallet?.balance} onNavigateHome={() => handleNavigate('home')} />
        <PWAInstallBanner />

        <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
          {user && user.status !== 'approved' ? (
            <PendingApprovalView />
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  {!user && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 px-4 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">🦒</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">TwigaMart</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenAuth('login')}
                            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 transition"
                          >
                            {t('login', language)}
                          </button>
                          <button
                            onClick={() => handleOpenAuth('register')}
                            className="text-xs font-extrabold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-xl shadow-sm transition"
                          >
                            Iyandikishe
                          </button>
                        </div>
                      </div>

                      <ImagesGallery
                        images={images}
                        onLikeImage={async () => handleOpenAuth('register')}
                      />
                    </div>
                  )}

                  {user && user.status === 'approved' && (
                    <HomeDashboard
                      balance={wallet?.balance || 0}
                      images={images}
                      paymentSettings={paymentSettings}
                      onLikeImage={handleLikeImage}
                      onNavigate={handleNavigate}
                    />
                  )}
                </>
              )}

              {activeTab === 'images' && (
                <ImagesGallery images={images} onLikeImage={handleLikeImage} />
              )}

              {activeTab === 'wallet' && (
                <>
                  {user ? (
                    <WalletView
                      balance={wallet?.balance || 0}
                      withdrawRequests={withdrawRequests}
                      paymentSettings={paymentSettings}
                      onSubmitWithdraw={handleSubmitWithdraw}
                    />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto">
                          <WalletIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-extrabold text-white">TwigaMart Wallet</h2>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Injiramo cyangwa iyandikishe kugira ngo ubone wallet yawe, agashimwe ka 15,000 BIF n'uburyo bwo kubikuza.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <button
                            onClick={() => handleOpenAuth('register')}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition"
                          >
                            Izangishe Ubwo Nyene (+15K BIF)
                          </button>
                          <button
                            onClick={() => handleOpenAuth('login')}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-xs border border-white/10 transition"
                          >
                            {t('login', language)}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'withdraw' && (
                <>
                  {user ? (
                    <WithdrawView
                      balance={wallet?.balance || 0}
                      withdrawRequests={withdrawRequests}
                      paymentSettings={paymentSettings}
                      onSubmitWithdraw={handleSubmitWithdraw}
                    />
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto">
                          <WalletIcon className="w-8 h-8" />
                        </div>
                        <p className="text-xs text-slate-300">Winjira kugirango usabe kubikuza (Login to request withdrawal).</p>
                        <button
                          onClick={() => handleOpenAuth('login')}
                          className="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs"
                        >
                          Winjira (Login)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'profile' && (
                <ProfileView />
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={handleNavigate} />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => {
            setAuthModalOpen(false);
            loadData();
          }}
        />
      </div>
    </div>
  );
};
