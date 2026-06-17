import { supabase } from './supabase';

// Fetch all categories ordered by display_order
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  return data || [];
}

// Fetch subcategories for a specific category
export async function getSubcategories(categoryId) {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    throw error;
  }
  return data || [];
}

// Fetch products based on category, subcategory, and optional filters
export async function getProducts({ categoryId, subcategoryId = null, status = null }) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId);

  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  } else if (status === 'uncategorized') {
    query = query.is('subcategory_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return data || [];
}

// Search products by name, title, description, size, or material
export async function searchProducts(searchTerm) {
  if (!searchTerm) return [];
  
  // Clean query
  const cleanSearch = searchTerm.trim();
  
  // ILIKE search in title
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), subcategories(name)')
    .or(`title.ilike.%${cleanSearch}%`);

  if (error) {
    console.error('Error searching products:', error);
    throw error;
  }
  return data || [];
}

// Fetch all products (useful for client-side search cache)
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
  return data || [];
}
