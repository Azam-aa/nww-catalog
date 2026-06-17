import { notFound } from 'next/navigation';
import { getCategories, getCategoryBySlug, getSubcategories, getProductsCached } from '../../../lib/db';
import { CategoryView } from '../../../components/catalog/CategoryView';

// Revalidate category details every 1 hour (static generation + ISR)
export const revalidate = 3600;

// Pre-render category pages at build time
export async function generateStaticParams() {
  const categories = await getCategories().catch(() => []);
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }) {
  const category = await getCategoryBySlug(params.slug).catch(() => null);
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} - National Welding Works`,
    description: `View designs and available types of ${category.name} at National Welding Works Koppal.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = params;

  // 1. Fetch category
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) {
    // Safely trigger Next.js 404 Page
    notFound();
  }

  // 2. Fetch subcategories for this category (cached)
  const subcategories = await getSubcategories(category.id).catch(() => []);

  // 3. Fetch initial products for this category (cached, limit 50)
  const products = await getProductsCached(category.id).catch(() => []);

  return (
    <CategoryView
      category={category}
      subcategories={subcategories || []}
      initialProducts={products || []}
    />
  );
}
