import { useParams, Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';
import { SubCategoryList } from '../components/catalog/SubCategoryList';
import { ChevronLeft } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function CategoryPage() {
  const { id } = useParams();
  const category = CATEGORIES.find(c => c.id === id);

  if (!category) {
    return (
      <div className="pt-14 pb-16">
        <EmptyState message="Category not found" />
      </div>
    );
  }

  return (
    <div className="pt-14 pb-16 min-h-screen">
      <div className="flex items-center px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-primary dark:bg-dark-secondary sticky top-14 z-30">
        <Link to="/" className="p-2 -ml-2 hover:bg-surface-secondary dark:hover:bg-dark-tertiary rounded-full transition-colors">
          <ChevronLeft size={24} className="text-ink-primary dark:text-white" />
        </Link>
        <h1 className="text-xl font-heading font-bold ml-2 text-ink-primary dark:text-white pb-0.5">
          {category.label}
        </h1>
      </div>
      <SubCategoryList category={category} />
    </div>
  );
}
