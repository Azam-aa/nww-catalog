import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Revalidate page data frequently (e.g. every 10 seconds)
export const revalidate = 10;

function getPlaceholderImage(text) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f0f0ec"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="%236b6b66">${text}</text></svg>`;
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export default async function HomePage() {
  // 1. Fetch categories
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (catError) {
    console.error('Error fetching categories for homepage:', catError);
  }
  const categories = categoriesData || [];

  // 2. Fetch products for counts and cover images
  const { data: productsData, error: prodError } = await supabase
    .from('products')
    .select('category_id, image_url, status')
    .order('created_at', { ascending: true });

  if (prodError) {
    console.error('Error fetching products for homepage counts:', prodError);
  }
  const products = productsData || [];

  // 3. Process categories
  const categoriesWithMeta = categories.map(cat => {
    const catProducts = products.filter(p => p.category_id === cat.id);
    const categorizedProducts = catProducts.filter(p => p.status === 'categorized');

    // Cover Image Logic:
    // 1. Manual category.cover_image_url
    // 2. First categorized product image
    // 3. First product image (even if uncategorized)
    // 4. Default placeholder
    let coverImage = cat.cover_image_url;
    if (!coverImage && categorizedProducts.length > 0) {
      coverImage = categorizedProducts[0].image_url;
    }
    if (!coverImage && catProducts.length > 0) {
      coverImage = catProducts[0].image_url;
    }
    if (!coverImage) {
      coverImage = getPlaceholderImage(cat.name);
    }

    return {
      ...cat,
      coverImage,
      itemCount: catProducts.length,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary dark:bg-dark-primary">
      {/* Brand Hero Banner */}
      <div className="px-5 py-8 bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border text-left">
        <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase mb-1">
          Koppal, Karnataka
        </p>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-ink-primary dark:text-white leading-none mb-2">
          National Welding Works
        </h1>
        <p className="text-sm text-ink-secondary dark:text-gray-400 max-w-sm">
          Steel Furniture Manufacturers. Browse our premium product catalog below.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="p-4 flex-1">
        <h2 className="text-lg font-heading font-extrabold text-ink-primary dark:text-white mb-4 uppercase tracking-wider">
          Categories
        </h2>

        {categoriesWithMeta.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-primary dark:bg-dark-secondary rounded-2xl border border-surface-border dark:border-dark-border">
            <p className="text-ink-secondary dark:text-gray-400 text-sm">
              No categories found in the database. Run the SQL setup script to seed categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {categoriesWithMeta.map(category => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm active:scale-98 transition-all duration-200"
              >
                {/* Image Container */}
                <div className="relative w-full h-[180px] bg-surface-tertiary dark:bg-dark-tertiary">
                  <Image
                    src={category.coverImage}
                    alt={category.name}
                    fill
                    unoptimized={category.coverImage.startsWith('data:').toString() === 'true'}
                    sizes="(max-width: 640px) 100vw, 350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={category.display_order <= 2}
                  />
                  {/* Item Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                      View all furniture designs
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-surface-secondary dark:bg-dark-tertiary flex items-center justify-center text-ink-primary dark:text-white group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
