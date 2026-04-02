import { PackageOpen } from 'lucide-react';

export function EmptyState({ message = "No items found" }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-ink-secondary dark:text-gray-400">
      <PackageOpen size={48} className="mb-4 opacity-50" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
