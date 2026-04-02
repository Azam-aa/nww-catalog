import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, className = "" }) {
  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <Loader2 className="animate-spin text-ink-muted dark:text-gray-500" size={size} />
    </div>
  );
}
