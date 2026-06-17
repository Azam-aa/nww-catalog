import { supabase } from './supabase';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// Cache objects for module-level in-memory cache backup
let cachedCategories = null;
let cachedSubcategories = {};

// 1. Fetch categories (cached for 1 hour)
const fetchCategories = async () => {
  if (cachedCategories) return cachedCategories;
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, cover_image_url, display_order')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  cachedCategories = data || [];
  return cachedCategories;
};

export const getCategories = cache(
  unstable_cache(fetchCategories, ['categories-list'], {
    revalidate: 3600,
    tags: ['categories'],
  })
);

// 2. Fetch subcategories for a specific category (cached for 1 hour)
const fetchSubcategories = async (categoryId) => {
  if (cachedSubcategories[categoryId]) return cachedSubcategories[categoryId];
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, category_id, name, slug, display_order')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    throw error;
  }
  cachedSubcategories[categoryId] = data || [];
  return cachedSubcategories[categoryId];
};

export const getSubcategories = cache((categoryId) =>
  unstable_cache(() => fetchSubcategories(categoryId), [`subcategories-${categoryId}`], {
    revalidate: 3600,
    tags: [`subcategories-${categoryId}`],
  })()
);

// 3. Fetch products for home page counts (only required fields, cached for 1 hour)
const fetchProductsForCounts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('category_id, image_url, status')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching products for counts:', error);
    throw error;
  }
  return data || [];
};

export const getProductsForCounts = cache(
  unstable_cache(fetchProductsForCounts, ['products-counts'], {
    revalidate: 3600,
    tags: ['products'],
  })
);

// 4. Fetch category detail by slug (using React cache)
export const getCategoryBySlug = cache(async (slug) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, cover_image_url')
    .eq('slug', slug);

  if (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
  return data && data[0] ? data[0] : null;
});

// 5. Fetch initial products for a category (cached, limit 50)
const fetchInitialProducts = async (categoryId) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, category_id, subcategory_id, image_url, title, material, color, size, description, price, cost_price, display_order, status, created_at')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error(`Error fetching initial products for category ${categoryId}:`, error);
    throw error;
  }
  return data || [];
};

export const getProductsCached = cache((categoryId) =>
  unstable_cache(() => fetchInitialProducts(categoryId), [`products-category-${categoryId}`], {
    revalidate: 3600,
    tags: [`products-category-${categoryId}`],
  })()
);

// 6. Fetch products based on category, subcategory, and filters (uncached for dynamic queries/infinite scroll)
export async function getProducts({ categoryId, subcategoryId = null, status = null, limit = 50, offset = 0 }) {
  let query = supabase
    .from('products')
    .select('id, category_id, subcategory_id, image_url, title, material, color, size, description, price, cost_price, display_order, status, created_at')
    .eq('category_id', categoryId);

  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  } else if (status === 'uncategorized') {
    query = query.is('subcategory_id', null);
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return data || [];
}

// 7. Search products by name, title, description, size, or material (optimized fields)
export async function searchProducts(searchTerm) {
  if (!searchTerm) return [];
  const cleanSearch = searchTerm.trim();
  const { data, error } = await supabase
    .from('products')
    .select('id, category_id, subcategory_id, image_url, title, material, color, size, description, price, cost_price, display_order, status, created_at')
    .or(`title.ilike.%${cleanSearch}%`);

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }
  return data || [];
}

// 8. Fetch all products (useful for client-side search cache - optimized fields)
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, category_id, subcategory_id, image_url, title, material, color, size, description, price, cost_price, display_order, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
  return data || [];
}
