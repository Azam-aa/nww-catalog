'use client';

import { useState } from 'react';
import { Lock, Loader2, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(false);
    setLoggingIn(true);

    try {
      const res = await fetch('/api/global-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Force reload page to home where the middleware will now allow access
        window.location.href = '/';
      } else {
        setLoginError(true);
      }
    } catch (err) {
      console.error(err);
      setLoginError(true);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen px-4 flex items-center justify-center bg-surface-secondary dark:bg-dark-primary">
      <div className="w-full max-w-sm bg-surface-primary dark:bg-dark-secondary p-8 rounded-2xl shadow-xl border border-surface-border dark:border-dark-border text-center">
        {/* Branding header */}
        <div className="mb-8">
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase mb-1">
            National Welding Works
          </p>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight text-ink-primary dark:text-white leading-none">
            Catalog Access
          </h1>
          <p className="text-xs text-ink-secondary dark:text-gray-400 mt-2">
            Enter credentials to view the product catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted dark:text-gray-500">
              <User size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl pl-10 pr-4 py-3 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted dark:text-gray-500">
              <Lock size={18} />
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl pl-10 pr-4 py-3 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold"
              required
            />
          </div>

          {loginError && (
            <p className="text-red-500 text-xs font-bold text-center mt-2">
              Incorrect username or password.
            </p>
          )}

          <button 
            type="submit" 
            disabled={loggingIn}
            className="w-full bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-2 mt-6 shadow-md shadow-brand-500/10"
          >
            {loggingIn && <Loader2 className="animate-spin" size={16} />}
            Enter Catalog
          </button>
        </form>
      </div>
    </div>
  );
}
