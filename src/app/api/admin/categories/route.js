import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabase';

// Helper to check admin session
function isAdminSession() {
  const cookieStore = cookies();
  const session = cookieStore.get('nww_admin_session');
  return session && session.value === 'authenticated';
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (catError) throw catError;

    // Fetch subcategories
    const { data: subcategories, error: subError } = await supabaseAdmin
      .from('subcategories')
      .select('*')
      .order('display_order', { ascending: true });

    if (subError) throw subError;

    // Combine
    const merged = categories.map(cat => ({
      ...cat,
      // Map properties to match original frontend expectations (label, subCategories)
      label: cat.name,
      subCategories: subcategories
        .filter(sub => sub.category_id === cat.id)
        .map(sub => ({
          ...sub,
          label: sub.name,
        }))
    }));

    return NextResponse.json({ categories: merged });
  } catch (error) {
    console.error('Error in categories GET route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAdminSession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { action, category, categoryId } = payload;
    const supabaseAdmin = getSupabaseAdmin();

    if (action === 'deleteCategory') {
      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'saveCategory') {
      const { id, label, icon, order, subCategories = [] } = category;

      if (!id || !label) {
        return NextResponse.json({ error: 'Missing ID or Label' }, { status: 400 });
      }

      const slug = id.toLowerCase().trim().replace(/\s+/g, '-');

      // 1. Upsert Category
      const { error: catError } = await supabaseAdmin
        .from('categories')
        .upsert({
          id,
          name: label,
          slug,
          display_order: typeof order === 'number' ? order : 0,
        });

      if (catError) throw catError;

      // 2. Delete existing subcategories for this category to overwrite
      const { error: deleteSubError } = await supabaseAdmin
        .from('subcategories')
        .delete()
        .eq('category_id', id);

      if (deleteSubError) throw deleteSubError;

      // 3. Insert new subcategories
      if (subCategories.length > 0) {
        const subRows = subCategories.map((sub, index) => {
          const subId = sub.id || `${id}-${index}`;
          const subSlug = subId.toLowerCase().trim().replace(/\s+/g, '-');
          return {
            id: subId,
            category_id: id,
            name: sub.label || sub.name || 'Unnamed Subcategory',
            slug: subSlug,
            display_order: typeof sub.display_order === 'number' ? sub.display_order : index + 1,
          };
        });

        const { error: subInsertError } = await supabaseAdmin
          .from('subcategories')
          .insert(subRows);

        if (subInsertError) throw subInsertError;
      }

      return NextResponse.json({ success: true });
    }

    // Default Seed / Reset Action
    if (action === 'resetCategories') {
      const { defaultCategories } = payload;

      if (!defaultCategories || defaultCategories.length === 0) {
        return NextResponse.json({ error: 'Missing default categories' }, { status: 400 });
      }

      // Clear all categories (cascades to subcategories)
      const { error: clearError } = await supabaseAdmin
        .from('categories')
        .delete()
        .neq('id', 'dummy_value_to_allow_all'); // Deletes all

      if (clearError) throw clearError;

      // Seed categories
      for (const [index, cat] of defaultCategories.entries()) {
        const slug = cat.id;
        
        const { error: seedCatErr } = await supabaseAdmin
          .from('categories')
          .insert({
            id: cat.id,
            name: cat.label || cat.name,
            slug: slug,
            display_order: index + 1,
          });

        if (seedCatErr) throw seedCatErr;

        if (cat.subCategories && cat.subCategories.length > 0) {
          const subRows = cat.subCategories.map((sub, sIdx) => ({
            id: sub.id,
            category_id: cat.id,
            name: sub.label || sub.name,
            slug: sub.id,
            display_order: sIdx + 1,
          }));

          const { error: seedSubErr } = await supabaseAdmin
            .from('subcategories')
            .insert(subRows);

          if (seedSubErr) throw seedSubErr;
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in categories write route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
