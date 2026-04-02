import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../data/categories';
import { ChevronRight, Archive, Bed, Armchair, Grid } from 'lucide-react';

const iconMap = {
  cabinet: Archive,
  bed: Bed,
  armchair: Armchair,
  grid: Grid
};

export function CategoryList() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="text-2xl font-heading font-bold text-ink-primary dark:text-white mb-2">Categories</h1>
      {CATEGORIES.map(category => {
        const Icon = iconMap[category.icon] || Grid;
        return (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="flex items-center w-full h-[80px] px-4 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-xl active:scale-95 transition-transform"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-secondary dark:bg-dark-tertiary mr-4 shrink-0">
              <Icon size={24} className="text-ink-secondary dark:text-gray-400" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-heading font-bold text-[18px] leading-tight text-ink-primary dark:text-white">
                {category.label}
              </span>
              <span className="text-sm text-ink-secondary dark:text-gray-400 mt-0.5">
                {category.subCategories.length} types
              </span>
            </div>
            <ChevronRight size={20} className="text-ink-muted dark:text-gray-500" />
          </Link>
        );
      })}
    </div>
  );
}
