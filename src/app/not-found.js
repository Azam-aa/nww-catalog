import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] px-6 flex flex-col items-center justify-center text-center bg-surface-secondary dark:bg-dark-primary">
      <div className="w-20 h-20 rounded-full bg-surface-tertiary dark:bg-dark-tertiary flex items-center justify-center mb-6 text-ink-muted">
        <Compass size={38} className="animate-spin" style={{ animationDuration: '20s' }} />
      </div>
      
      <h2 className="font-heading font-extrabold text-2xl text-ink-primary dark:text-white mb-3">
        Page Not Found
      </h2>
      
      <p className="text-sm text-ink-secondary dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
        The catalog category or product you are looking for does not exist, or has been moved by the administrator.
      </p>
      
      <Link 
        href="/"
        className="flex items-center gap-2 px-6 py-3 bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-bold rounded-xl text-sm shadow-md active:scale-95 transition-all"
      >
        <Home size={16} />
        Back to Catalog Home
      </Link>
    </div>
  );
}
