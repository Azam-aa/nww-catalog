import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import { revalidateTag, revalidatePath } from 'next/cache';

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
    const { productId, subcategoryId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // 3. Update product in database
    const supabaseAdmin = getSupabaseAdmin();
    const status = subcategoryId ? 'categorized' : 'uncategorized';

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        subcategory_id: subcategoryId || null,
        status: status,
      })
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Error updating product subcategory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data[0]) {
      const categoryId = data[0].category_id;
      revalidateTag('products');
      revalidateTag(`products-category-${categoryId}`);
      revalidatePath('/');
    }

    return NextResponse.json({ success: true, product: data[0] });
  } catch (error) {
    console.error('Internal server error during subcategory assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
