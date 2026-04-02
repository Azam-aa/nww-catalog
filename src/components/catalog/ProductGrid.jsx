import { EmptyState } from '../ui/EmptyState';

export function ProductGrid({ isEmpty, children }) {
  if (isEmpty) {
    return <EmptyState message="No products found" />;
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3 pb-24">
      {children}
    </div>
  );
}
