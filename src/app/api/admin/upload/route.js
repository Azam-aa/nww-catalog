import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Verify admin session cookie
    const cookieStore = cookies();
    const session = cookieStore.get('nww_admin_session');

    if (!session || session.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // 2. Parse request payload as Form Data
    const formData = await request.formData();
    const file = formData.get('file');
    const categoryId = formData.get('categoryId');
    const title = formData.get('title');

    if (!file || !categoryId) {
      return NextResponse.json({ error: 'Missing file or category ID' }, { status: 400 });
    }

    // 3. Convert file stream to ArrayBuffer/Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Generate clean destination filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    // Clean filename: timestamp + random alphanumeric
    const randomHash = Math.random().toString(36).substring(2, 8);
    const filename = `${Date.now()}-${randomHash}.${fileExtension}`;
    const storagePath = `${categoryId}/${filename}`;

    const supabaseAdmin = getSupabaseAdmin();

    // 5. Upload buffer to Supabase Storage bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError);
      return NextResponse.json({ error: 'Storage upload failed: ' + uploadError.message }, { status: 500 });
    }

    // 6. Retrieve public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    // 7. Insert product into database
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('products')
      .insert({
        category_id: categoryId,
        subcategory_id: null,
        image_url: publicUrl,
        title: title || 'Uncategorized Furniture',
        status: 'uncategorized',
        display_order: 0,
      })
      .select();

    if (dbError) {
      console.error('Supabase Database Write Error:', dbError);
      return NextResponse.json({ error: 'Database write failed: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: dbData[0] });
  } catch (error) {
    console.error('Fatal upload endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const maxDuration = 60; // Extend Vercel function timeout if uploading large chunks
