import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES, t } from '../locales/translations';
import { Language } from '../types';
import { authApi, userApi } from '../services/api';
import {
  User as UserIcon,
  Phone,
  Globe,
  Moon,
  Sun,
  LogOut,
  KeyRound,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Save,
  Check,
  Shield,
  Upload,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, role, language, setLanguage, darkMode, setDarkMode, logout, refreshUser } = useAuth();

  // Edit Profile States
  const [editingProfile, setEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editPhone, setEditPhone] = useState(user?.phone_number || '');
  const [editCountry, setEditCountry] = useState(user?.country || 'Burundi');
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profile_picture || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileLoading(true);

    try {
      const res = await userApi.updateProfile({
        username: editUsername.trim(),
        phone_number: editPhone.trim(),
        country: editCountry.trim(),
        profile_picture: profilePicUrl.trim(),
        language,
      });
      setProfileSuccess(res.message || 'Profile updated successfully!');
      if (refreshUser) await refreshUser();
      setEditingProfile(false);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('File size too large (Max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Uzuzaza amagambo yose y\'ibanga (Please fill all password fields)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('Amagambo mashya y\'ibanga ntamahura (New passwords do not match)');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Ijambo rishya ry\'ibanga rigomba kuba nibura rifite inyuguti 6');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      setPwdSuccess(res.message || 'Ijambo ry\'ibanga ryahinduwe neza!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 2500);
    } catch (err: any) {
      setPwdError(err.message || 'Harabaye ikosa mu guhindura ijambo ry\'ibanga');
    } finally {
      setPwdLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in text-center py-12">
        <UserIcon className="w-16 h-16 text-slate-500 mx-auto" />
        <p className="text-sm font-bold text-slate-300">Nyamuneka winjire kugirango ubone profile yawe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 text-slate-900 dark:text-white shadow-lg dark:shadow-2xl space-y-4 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-3xl font-black text-slate-950 shadow-lg">
                🦒
              </div>
            )}
            <button
              onClick={() => setEditingProfile(true)}
              className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-lg shadow-md hover:bg-emerald-400 transition"
              title="Edit Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">@{user.username}</h1>
              <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase backdrop-blur-md">
                {user.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {user.phone_country_code} {user.phone_number}
              </span>
            </p>
            {role === 'admin' && (
              <span className="mt-1 inline-block bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                👑 Admin
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setEditingProfile(!editingProfile);
            setEditUsername(user.username);
            setEditPhone(user.phone_number);
            setEditCountry(user.country || 'Burundi');
            setProfilePicUrl(user.profile_picture || '');
          }}
          className="w-full bg-slate-100 dark:bg-slate-950/80 hover:bg-slate-200 dark:hover:bg-slate-950 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 p-3 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-2 transition"
        >
          <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{editingProfile ? 'Funga Guhindura (Close Edit)' : 'Hindura Umwirondoro (Edit Profile & Photo)'}</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      {editingProfile && (
        <div className="bg-slate-900/90 backdrop-blur-3xl border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
            <Edit2 className="w-4 h-4 text-emerald-400" />
            <span>EDIT PROFILE & PICTURE (CLOUDINARY / PHOTO)</span>
          </h2>

          {profileError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            {/* Cloudinary / Image URL or Upload */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Profile Picture (Cloudinary URL or File Upload)
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={profilePicUrl}
                  onChange={(e) => setProfilePicUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  placeholder="https://res.cloudinary.com/demo/image/upload/..."
                />
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold p-2.5 rounded-xl border border-white/10 flex items-center space-x-1 shrink-0">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px]">Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              {profilePicUrl && (
                <div className="flex items-center space-x-3 p-2 bg-slate-950/60 rounded-xl border border-white/5">
                  <img src={profilePicUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-[10px] text-slate-400 font-medium">Image Preview Ready</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Izina y'Umukoresha (Username)</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl p-2.5 text-white font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Telefoni (Phone Number)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Igihugu (Country)</label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileLoading ? 'Biri kubikwa...' : 'Bika Izangishe (Save Profile)'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Language Settings */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 space-y-3 shadow-lg dark:shadow-2xl transition-colors duration-300">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>LANGUAGE / HITAMO URURIMI</span>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as Language)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition ${
                language === lang.code
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 backdrop-blur-md'
                  : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </span>
              {language === lang.code && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Security & Password */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 space-y-3 shadow-lg dark:shadow-2xl transition-colors duration-300">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>SECURITY & PASSWORD</span>
        </h2>

        {!showChangePassword ? (
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 hover:border-amber-500/40 p-3 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between transition"
          >
            <span>Hindura Ijambo ry'Ibanga (Change Password)</span>
            <KeyRound className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            {pwdError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 p-2 rounded-xl">
                {pwdError}
              </p>
            )}
            {pwdSuccess && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl">
                {pwdSuccess}
              </p>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Ijambo ry'Ibanga rya cyera (Current Password)</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Ijambo rishya (New Password)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Ongera wandike (Confirm Password)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                required
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={pwdLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs"
              >
                {pwdLoading ? 'Biri hano...' : 'Bika Password'}
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(false)}
                className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Hagarara
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Theme & Logout */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 space-y-3 shadow-lg dark:shadow-2xl transition-colors duration-300">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">PREFERENCES & ACCOUNT</h2>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 p-3 rounded-2xl text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between transition"
        >
          <span className="flex items-center space-x-2">
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-black">{darkMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={logout}
          className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 p-3.5 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center space-x-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sohoka (Logout)</span>
        </button>
      </div>
    </div>
  );
};
