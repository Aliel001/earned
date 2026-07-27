import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../locales/translations';
import { Download, X, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { language } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 text-slate-950 px-4 py-2.5 shadow-lg flex items-center justify-between z-30 sticky top-16">
      <div className="flex items-center space-x-2 text-xs font-bold">
        <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
        <span>Shyira TwigaMart App ku telefoni yawe!</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstall}
          className="bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-[11px] px-3 py-1 rounded-full shadow flex items-center space-x-1"
        >
          <Download className="w-3 h-3" />
          <span>Install PWA</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-950 hover:bg-slate-950/10 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
