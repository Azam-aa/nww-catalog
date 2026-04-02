import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function SubCategoryList({ category }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {category.subCategories.map(sub => (
        <Link
          key={sub.id}
          to={`/products/${category.id}/${sub.id}`}
          className="flex items-center w-full min-h-[64px] px-4 py-2 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-xl active:scale-95 transition-transform"
        >
          <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
            <span className="font-heading font-bold text-base leading-tight text-ink-primary dark:text-white">
              {sub.label}
            </span>
            {sub.weightTypes && sub.weightTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sub.weightTypes.map(wt => (
                  <Badge key={wt}>{wt}</Badge>
                ))}
              </div>
            )}
          </div>
          <ChevronRight size={20} className="text-ink-muted dark:text-gray-500 shrink-0 ml-2" />
        </Link>
      ))}
    </div>
  );
}
