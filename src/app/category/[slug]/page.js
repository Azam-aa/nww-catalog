import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { CategoryView } from '../../../components/catalog/CategoryView';

export const dynamic = 'force-dynamic';

// Revalidate category details often
export const revalidate = 10;

export async function generateMetadata({ params }) {
  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', params.slug);

  const category = categories && categories[0];
  if (!category) return { title: 'Category Not Found' };

  return {
    title: `${category.name} - National Welding Works`,
    description: `View designs and available types of ${category.name} at National Welding Works Koppal.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = params;

  // 1. Fetch category
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug);

  if (catError) {
    console.error('Error fetching category:', catError);
  }

  const category = categories && categories[0];
  if (!category) {
    // Safely trigger Next.js 404 Page
    notFound();
  }

  // 2. Fetch subcategories for this category
  const { data: subcategories, error: subError } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', category.id)
    .order('display_order', { ascending: true });

  if (subError) {
    console.error('Error fetching subcategories:', subError);
  }

  // 3. Fetch products for this category
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  if (prodError) {
    console.error('Error fetching products:', prodError);
  }

  return (
    <CategoryView
      category={category}
      subcategories={subcategories || []}
      initialProducts={products || []}
    />
  );
}
