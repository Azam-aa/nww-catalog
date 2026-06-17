'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShareCart } from '../../context/ShareCartContext';
import { Home, ShoppingBag } from 'lucide-react';

export function BottomNav() {
  const { cartCount } = useShareCart();
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isCart = pathname === '/share-cart';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface-primary/95 dark:bg-dark-primary/95 backdrop-blur-xl border-t border-surface-border dark:border-dark-border">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors ${
            isHome 
              ? 'text-brand-600 dark:text-brand-400' 
              : 'text-ink-muted dark:text-gray-500 hover:text-ink-primary dark:hover:text-gray-300'
          }`}
        >
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Share Cart */}
        <Link
          href="/share-cart"
          className={`relative flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors ${
            isCart 
              ? 'text-brand-600 dark:text-brand-400' 
              : 'text-ink-muted dark:text-gray-500 hover:text-ink-primary dark:hover:text-gray-300'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce-once">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Share</span>
        </Link>
      </div>
    </nav>
  );
}
