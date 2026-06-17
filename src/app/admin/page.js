'use client';

import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Lock, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the heavy admin dashboard components since public users never need them
const AdminDashboard = dynamic(() => import('../../components/admin/AdminDashboard'), {
  loading: () => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-brand-500" size={36} />
      <p className="text-xs font-bold text-ink-secondary dark:text-gray-400">Loading Dashboard Console...</p>
    </div>
  ),
  ssr: false,
});

export default function AdminPage() {
  const { isAdmin, loading: adminLoading, login } = useAdmin();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Handle password submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(false);
    setLoggingIn(true);
    try {
      const success = await login(password);
      if (!success) {
        setLoginError(true);
      }
    } catch (err) {
      console.error(err);
      setLoginError(true);
    } finally {
      setLoggingIn(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={36} />
      </div>
    );
  }

  // 1. Password Protection Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] px-4 flex items-center justify-center bg-surface-secondary dark:bg-dark-primary">
        <div className="w-full max-w-sm bg-surface-primary dark:bg-dark-secondary p-8 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border text-center">
          <div className="w-16 h-16 bg-surface-secondary dark:bg-dark-tertiary rounded-full flex items-center justify-center mx-auto mb-6 text-ink-secondary dark:text-gray-400">
            <Lock size={32} />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-ink-primary dark:text-white mb-2">
            Admin Access
          </h2>
          <p className="text-ink-secondary dark:text-gray-400 text-xs mb-6">
            Enter password to manage products and categories.
          </p>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-4 py-3.5 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-center tracking-[0.2em] font-bold text-lg"
              />
              {loginError && (
                <p className="text-red-500 text-xs font-bold mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            <button 
              type="submit" 
              disabled={loggingIn}
              className="w-full bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
            >
              {loggingIn && <Loader2 className="animate-spin" size={16} />}
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Render Lazy Loaded Admin Dashboard
  return <AdminDashboard />;
}
