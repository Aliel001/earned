import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { GeneralSettings, Language, User } from '../types.js';
import { authApi, generalSettingsApi, getAuthToken, setAuthToken, userApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  role: 'user' | 'admin' | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isLoading: boolean;
  generalSettings: GeneralSettings | null;
  registrationBonus: number;
  refreshSettings: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email?: string;
    country?: string;
    phone_country_code: string;
    phone_number: string;
    password: string;
    language: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('twigamart_lang') as Language) || 'rn';
  });
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    return localStorage.getItem('twigamart_dark') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await generalSettingsApi.getSettings();
      if (res) {
        setGeneralSettings(res);
      }
    } catch {
      // silent fallback
    }
  }, []);

  const registrationBonus = useMemo(() => {
    if (generalSettings && typeof generalSettings.registration_bonus === 'number') {
      return generalSettings.registration_bonus;
    }
    return 15000;
  }, [generalSettings]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('twigamart_lang', lang);
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setDarkModeState(dark);
    localStorage.setItem('twigamart_dark', dark ? 'true' : 'false');
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await userApi.getMe();
      setUser(res.user);
      setRole(res.role);
      if (res.user.language) {
        setLanguageState(res.user.language);
      }
    } catch {
      // User is not logged in or token is invalid/expired - clear state silently
      setAuthToken(null);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshUser();
    // Real-time polling to auto-update user status and settings
    const interval = setInterval(() => {
      refreshSettings();
      const token = getAuthToken();
      if (token) {
        userApi
          .getMe()
          .then((res) => {
            if (res && res.user) {
              setUser((prev) => {
                if (!prev) return res.user;
                if (
                  prev.id === res.user.id &&
                  prev.status === res.user.status &&
                  prev.username === res.user.username &&
                  prev.wallet?.balance === res.user.wallet?.balance &&
                  prev.phone_number === res.user.phone_number &&
                  prev.profile_picture === res.user.profile_picture &&
                  prev.country === res.user.country
                ) {
                  return prev;
                }
                return res.user;
              });
              setRole((prev) => (prev === res.role ? prev : res.role));
            }
          })
          .catch(() => {
            // silent fail
          });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [refreshUser, refreshSettings]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ username, password });
      setAuthToken(res.token);
      setUser(res.user);
      setRole(res.role);
      if (res.user.language) {
        setLanguageState(res.user.language);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    username: string;
    email?: string;
    country?: string;
    phone_country_code: string;
    phone_number: string;
    password: string;
    language: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adminLogin = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.adminLogin({ username, password });
      setAuthToken(res.token);
      setUser(res.user);
      setRole('admin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      role,
      language,
      setLanguage,
      darkMode,
      setDarkMode,
      isLoading,
      generalSettings,
      registrationBonus,
      refreshSettings,
      login,
      register,
      adminLogin,
      logout,
      refreshUser,
    }),
    [
      user,
      role,
      language,
      setLanguage,
      darkMode,
      setDarkMode,
      isLoading,
      generalSettings,
      registrationBonus,
      refreshSettings,
      login,
      register,
      adminLogin,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
