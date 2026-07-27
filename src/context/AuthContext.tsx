import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, User } from '../types';
import { authApi, getAuthToken, setAuthToken, userApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'user' | 'admin' | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password: string;
    language: string;
  }) => Promise<void>;
  adminLogin: (username?: string, password?: string) => Promise<void>;
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

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('twigamart_lang', lang);
  };

  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark);
    localStorage.setItem('twigamart_dark', dark ? 'true' : 'false');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const refreshUser = async () => {
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
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
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
  };

  const register = async (data: {
    username: string;
    phone_country_code: string;
    phone_number: string;
    password: string;
    language: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      setAuthToken(res.token);
      setUser(res.user);
      setRole(res.role);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username = 'admin', password = 'admin123') => {
    setIsLoading(true);
    try {
      const res = await authApi.adminLogin({ username, password });
      setAuthToken(res.token);
      setUser(res.user);
      setRole('admin');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        isLoading,
        login,
        register,
        adminLogin,
        logout,
        refreshUser,
      }}
    >
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
