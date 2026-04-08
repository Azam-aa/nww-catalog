import { useShopMode } from '../../context/ShopModeContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Lock, Unlock, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { shopMode, toggleShopMode } = useShopMode();

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] bg-surface-primary dark:bg-dark-primary border-b border-surface-border dark:border-dark-border z-40 flex items-center justify-between px-4">
      <Link to="/" className="flex items-baseline space-x-1">
        <span className="font-heading font-bold text-xl text-ink-primary dark:text-white">NWW</span>
        <span className="text-sm text-ink-secondary dark:text-gray-400">Catalog</span>
      </Link>
      
      <div className="flex items-center space-x-2">
        <Link 
          to="/search" 
          className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors text-ink-primary dark:text-white"
          aria-label="Search products"
        >
          <Search size={20} />
        </Link>
        {shopMode && (
          <Link 
            to="/admin" 
            className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors text-ink-primary dark:text-white"
            aria-label="Add new product"
          >
            <Plus size={20} />
          </Link>
        )}
        <ThemeToggle />
        <button
          onClick={toggleShopMode}
          className="p-2 hover:bg-surface-secondary dark:hover:bg-dark-secondary rounded-full transition-colors"
          aria-label="Toggle shop mode"
        >
          {shopMode ? (
            <Unlock className="text-brand-500" size={20} />
          ) : (
            <Lock className="text-ink-secondary dark:text-gray-400" size={20} />
          )}
        </button>
      </div>
    </header>
  );
}
