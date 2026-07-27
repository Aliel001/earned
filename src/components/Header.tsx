import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES, t } from '../locales/translations';
import { Language } from '../types';
import { Globe, Moon, Sun, User as UserIcon, LogOut, ShieldCheck, Wallet } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  walletBalance?: number;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, walletBalance, onNavigateHome }) => {
  const { user, role, language, setLanguage, darkMode, setDarkMode, logout } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-2xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={onNavigateHome}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90 transition active:scale-98"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 font-black text-xl">
            🦒
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">TwigaMart</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                BI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Burundi Rewards & Wallet</p>
          </div>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Balance Badge if logged in */}
          {user && role === 'user' && walletBalance !== undefined && (
            <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
              <Wallet className="w-3.5 h-3.5" />
              <span>{walletBalance.toLocaleString()} BIF</span>
            </div>
          )}

          {/* Admin Badge */}
          {role === 'admin' && (
            <div className="flex items-center space-x-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </div>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 backdrop-blur-md transition"
              title="Select Language"
            >
              <span>{currentLangObj.flag}</span>
              <span className="hidden md:inline uppercase">{currentLangObj.code}</span>
              <Globe className="w-3.5 h-3.5 ml-0.5 text-slate-500 dark:text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-white/10">
                  {t('select_language', language)}
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/60 transition ${
                      language === lang.code ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </span>
                    {language === lang.code && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/10 backdrop-blur-md transition active:scale-95"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Auth Action Buttons */}
          {user ? (
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout', language)}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs font-bold px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                {t('login', language)}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                {t('register', language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
