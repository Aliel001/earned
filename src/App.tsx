import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { UserLayout } from './components/UserLayout.js';
import { AdminPanel } from './components/AdminPanel.js';

const MainAppContent: React.FC = () => {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl mx-auto flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/20 animate-bounce">
            🦒
          </div>
          <p className="text-xs text-emerald-400 font-bold tracking-wider uppercase">TwigaMart Burundi</p>
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // STRICT ROLE ROUTING SEPARATION
  // Role == ADMIN -> Admin Application exclusively
  if (role === 'admin') {
    return <AdminPanel />;
  }

  // Role == USER (or guest) -> User Application exclusively
  return <UserLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
