'use client';

import Link from 'next/link';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Lock, Unlock, Plus, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export function Header() {
  const { isAdmin, loading, logout } = useAdmin();

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] bg-surface-primary dark:bg-dark-primary border-b border-surface-border dark:border-dark-border z-40 flex items-center justify-between px-4">
      <Link href="/" className="flex items-baseline space-x-1">
        <span className="font-heading font-bold text-xl text-ink-primary dark:text-white">NWW</span>
        <span className="text-sm text-ink-secondary dark:text-gray-400">Catalog</span>
      </Link>
      
      <div className="flex items-center space-x-2">
        <Link 
          href="/search" 
          className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors text-ink-primary dark:text-white"
          aria-label="Search products"
        >
          <Search size={20} />
        </Link>
        {isAdmin && (
          <Link 
            href="/admin" 
            className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors text-ink-primary dark:text-white"
            aria-label="Admin panel"
          >
            <Plus size={20} />
          </Link>
        )}
        <ThemeToggle />
        {!loading && isAdmin ? (
          <button
            onClick={logout}
            className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors"
            aria-label="Lock Admin"
          >
            <Unlock className="text-brand-500" size={20} />
          </button>
        ) : (
          <Link
            href="/admin"
            className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors"
            aria-label="Admin access"
          >
            <Lock className="text-ink-secondary dark:text-gray-400" size={20} />
          </Link>
        )}
      </div>
    </header>
  );
}
