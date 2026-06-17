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

    const { productId, imageUrl } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Extract image path to delete from storage if it is a Supabase Storage image
    if (imageUrl && imageUrl.includes('/storage/v1/object/public/product-images/')) {
      const parts = imageUrl.split('/storage/v1/object/public/product-images/');
      if (parts.length > 1) {
        const storagePath = parts[1];
        const { error: storageError } = await supabaseAdmin.storage
          .from('product-images')
          .remove([storagePath]);
        
        if (storageError) {
          console.error('Warning: Error removing image from storage:', storageError);
        }
      }
    }

    // 3. Delete from database
    const { data, error: dbError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .select();

    if (dbError) {
      console.error('Error deleting product from database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (data && data[0]) {
      const categoryId = data[0].category_id;
      revalidateTag('products');
      revalidateTag(`products-category-${categoryId}`);
      revalidatePath('/');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Internal server error during product deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
