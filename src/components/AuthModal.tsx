import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COUNTRY_CODES, SUPPORTED_LANGUAGES, t } from '../locales/translations';
import { Language } from '../types';
import { X, Lock, Phone, User, Globe, Gift, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'login', onClose }) => {
  const { login, register, adminLogin, language, setLanguage } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [username, setUsername] = useState('');
  const [countryCode, setCountryCode] = useState('+257');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>(language);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(t('error', language) + ': Uzuze imyanya yose ikenewe.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!phoneNumber.trim()) {
          setError('Nyamuneka andika numero ya telefoni.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Inyandiko y\'ibanga ntiyemezwa kimwe (Passwords do not match).');
          setIsSubmitting(false);
          return;
        }
        await register({
          username,
          phone_country_code: countryCode,
          phone_number: phoneNumber,
          password,
          language: selectedLang,
        });
      } else {
        await login(username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await adminLogin('admin', 'admin123');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 text-slate-100 rounded-3xl w-full max-w-md p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20 font-black mb-3">
            🦒
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {mode === 'register' ? t('register', language) : t('login', language)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">TwigaMart Burundi - Earn BIF by Liking Images</p>
        </div>

        {/* Bonus Banner on Register */}
        {mode === 'register' && (
          <div className="mb-5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center space-x-3 text-emerald-300 backdrop-blur-md">
            <Gift className="w-8 h-8 text-emerald-400 flex-shrink-0 animate-bounce" />
            <div>
              <p className="text-xs font-bold text-white flex items-center space-x-1">
                <span>Bonus y\'Ikaze: 15,000 BIF</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </p>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                Rungika form ugire 15,000 BIF ya bonus mu gapuri kawe uwo mwanya!
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Language Selector (Single Button/Dropdown) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Language (Hitamo Ururimi)</span>
              </span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  const lang = e.target.value as Language;
                  setSelectedLang(lang);
                  setLanguage(lang);
                }}
                className="w-full bg-slate-950/90 border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold appearance-none cursor-pointer"
              >
                <option value="rn" className="bg-slate-900 text-white">🇧🇮 Kirundi</option>
                <option value="rw" className="bg-slate-900 text-white">🇷🇼 Kinyarwanda</option>
                <option value="en" className="bg-slate-900 text-white">🇬🇧 English</option>
                <option value="fr" className="bg-slate-900 text-white">🇫🇷 Français</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('username', language)}</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. keza_bujumbura"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Registration specific fields */}
          {mode === 'register' && (
            <>
              {/* Phone Country Code & Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('phone_number', language)}
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5 relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none font-semibold"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                          {c.flag} {c.country} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-7 relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="69 11 22 33"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('password', language)}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Confirm Password if Register */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('confirm_password', language)}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition duration-200 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'register' ? (
              <span>{t('register', language)} (+15,000 BIF)</span>
            ) : (
              <span>{t('login', language)}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            {mode === 'login' ? t('no_account_yet', language) : t('already_have_account', language)}
          </button>

          {/* Quick Admin Test Login */}
          <div>
            <button
              type="button"
              onClick={handleAdminQuickLogin}
              disabled={isSubmitting}
              className="text-[11px] text-slate-300 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 transition backdrop-blur-md"
            >
              🔑 Quick Admin Login (Testing)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
