import { useState } from 'react';
import { AdminForm } from '../components/admin/AdminForm';
import { Lock } from 'lucide-react';
import { useShopMode } from '../context/ShopModeContext';
import { useLocation } from 'react-router-dom';

export function AdminPage() {
  const { shopMode } = useShopMode();
  const location = useLocation();
  const editingProduct = location.state?.product || null;

  const [isAuthenticated, setIsAuthenticated] = useState(shopMode);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated || shopMode) {
    return <div className="pt-[56px]"><AdminForm editingProduct={editingProduct} /></div>;
  }

  return (
    <div className="min-h-screen pt-14 px-4 flex items-center justify-center bg-surface-secondary dark:bg-dark-primary">
      <div className="w-full max-w-sm bg-surface-primary dark:bg-dark-secondary p-8 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border text-center pb-12 mb-20">
        <div className="w-16 h-16 bg-surface-secondary dark:bg-dark-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-ink-secondary dark:text-gray-400" />
        </div>
        <h2 className="font-heading font-bold text-2xl text-ink-primary dark:text-white mb-2">Admin Access</h2>
        <p className="text-ink-secondary dark:text-gray-400 text-sm mb-6">Enter password to manage catalog</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg px-4 py-3 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-center tracking-[0.2em]"
            />
            {error && <p className="text-red-500 text-xs mt-2">Incorrect password</p>}
          </div>
          <button 
            type="submit" 
            className="w-full bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
