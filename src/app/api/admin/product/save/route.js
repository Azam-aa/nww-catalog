import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Verify admin session cookie
    const cookieStore = cookies();
    const session = cookieStore.get('nww_admin_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // 2. Parse request payload
    const payload = await request.json();
    const {
      productId,
      categoryId,
      subcategoryId,
      imageUrl,
      title,
      material,
      color,
      size,
      description,
      price,
      costPrice
    } = payload;

    if (!categoryId || !imageUrl) {
      return NextResponse.json({ error: 'Category ID and Image URL are required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const status = subcategoryId ? 'categorized' : 'uncategorized';

    const cleanPrice = price !== '' && price !== null && price !== undefined ? parseFloat(price) : null;
    const cleanCostPrice = costPrice !== '' && costPrice !== null && costPrice !== undefined ? parseFloat(costPrice) : null;

    const rowData = {
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      image_url: imageUrl,
      title: title || 'Unnamed Furniture',
      material: material || null,
      color: color || null,
      size: size || null,
      description: description || null,
      price: isNaN(cleanPrice) ? null : cleanPrice,
      cost_price: isNaN(cleanCostPrice) ? null : cleanCostPrice,
      status,
    };

    let result;
    if (productId) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(rowData)
        .eq('id', productId)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert(rowData)
        .select();

      if (error) throw error;
      result = data[0];
    }

    return NextResponse.json({ success: true, product: result });
  } catch (error) {
    console.error('Error in save product API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
