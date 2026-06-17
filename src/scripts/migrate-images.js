import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Standard node fetch for downloading buffers

// Load credentials specifically from the .env.migration file
dotenv.config({ path: '.env.migration' });

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

// Verify that all required keys are present
const missingKeys = [];
if (!FIREBASE_API_KEY) missingKeys.push('FIREBASE_API_KEY');
if (!FIREBASE_PROJECT_ID) missingKeys.push('FIREBASE_PROJECT_ID');
if (!NEXT_PUBLIC_SUPABASE_URL) missingKeys.push('NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');

if (missingKeys.length > 0) {
  console.error('ERROR: Missing required keys in .env.migration:', missingKeys.join(', '));
  process.exit(1);
}

// Initialize Firebase client
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

console.log(`Connecting to Firebase Project: ${FIREBASE_PROJECT_ID}...`);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Initialize Supabase Admin Client (using service_role key to bypass RLS)
console.log(`Connecting to Supabase Project: ${NEXT_PUBLIC_SUPABASE_URL}...`);
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Subcategory mapping table to convert old Firestore IDs to the new Postgres IDs
const subcategoryMap = {
  'single-door': 'sd-mh',
  'double-door': 'dd-mh',
  'triple-door': 'td-mh',
  'sd-lw': 'sd-lw',
  'sd-mh': 'sd-mh',
  'sd-h': 'sd-h',
  'dd-lw': 'dd-lw',
  'dd-mh': 'dd-mh',
  'dd-h': 'dd-h',
  'td-lw': 'td-lw',
  'td-mh': 'td-mh',
  'td-h': 'td-h',
  'office': 'office',
  'wall-doors': 'wall-doors',
  'up-down': 'up-down',
  'bail-patti': 'bail-patti',
  'nawar': 'nawar',
  'single-rm': 'single-rm',
  'single-h': 'single-h',
  'double-rm': 'double-rm',
  'double-mh': 'double-mh',
  'four-and-half': 'four-and-half',
  'five-by-six': 'five-by-six',
  'sofa-diwan': 'sofa-diwan',
  'dressing-table': 'dressing-table-sub',
  'metal-chairs': 'metal-chairs',
  'steel-chairs': 'steel-chairs',
  'plastic-chairs': 'plastic-chairs',
  'plastic-stools': 'plastic-stools',
  'ladders-stools': 'ladders-stools',
  'racks': 'racks-sub',
  'office-table': 'office-table',
  'dining-table': 'dining-table',
  'lockers': 'lockers-sub',
  'trunks': 'trunks-sub'
};

async function migrate() {
  console.log('--- STARTING MIGRATION ---');
  let totalFirestoreProducts = 0;
  let totalUploadedSupabase = 0;
  let totalFailed = 0;
  const failedUrls = [];

  try {
    // 1. Fetch products from Firestore
    const querySnapshot = await getDocs(collection(db, 'products'));
    const firestoreProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    totalFirestoreProducts = firestoreProducts.length;
    console.log(`Found ${totalFirestoreProducts} products in Firestore.`);

    if (totalFirestoreProducts === 0) {
      console.log('No products to migrate.');
      return;
    }

    // 2. Iterate and migrate each product
    for (let index = 0; index < firestoreProducts.length; index++) {
      const product = firestoreProducts[index];
      const { id, name, category, subCategory, imageUrl, displayOrder, material, color, size, description, price, costPrice } = product;

      console.log(`[${index + 1}/${totalFirestoreProducts}] Migrating product: "${name || 'Unnamed'}" (${id})...`);

      if (!imageUrl) {
        console.warn(`⚠️ Warning: Product ${id} has no image URL. Skipping.`);
        totalFailed++;
        failedUrls.push({ id, name, url: 'N/A (No URL)' });
        continue;
      }

      try {
        // Download from Cloudinary
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageUrl} (Status: ${response.status})`);
        }
        const buffer = await response.arrayBuffer();

        // Determine destination folder and filename
        const cleanCategory = category || 'uncategorized';
        // Extract original file extension or fallback to jpg
        const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const filename = `${id}.${extension}`;
        const storagePath = `${cleanCategory}/${filename}`;

        // Upload to Supabase Storage
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(storagePath, Buffer.from(buffer), {
            contentType,
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL from Supabase Storage
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath);

        // Map subcategory if possible
        const mappedSubCategory = subcategoryMap[subCategory] || null;

        // Convert price and costPrice to numbers
        const cleanPrice = price !== undefined && price !== null ? parseFloat(price) : null;
        const cleanCostPrice = costPrice !== undefined && costPrice !== null ? parseFloat(costPrice) : null;

        // Insert into PostgreSQL
        const { error: dbError } = await supabase
          .from('products')
          .insert({
            category_id: cleanCategory,
            subcategory_id: mappedSubCategory,
            image_url: publicUrl,
            title: name || null,
            material: material || null,
            color: color || null,
            size: size || null,
            description: description || null,
            price: isNaN(cleanPrice) ? null : cleanPrice,
            cost_price: isNaN(cleanCostPrice) ? null : cleanCostPrice,
            display_order: typeof displayOrder === 'number' ? displayOrder : 0,
            status: mappedSubCategory ? 'categorized' : 'uncategorized',
          });

        if (dbError) {
          throw dbError;
        }

        console.log(`✅ Success! Uploaded to Supabase Storage and DB updated.`);
        totalUploadedSupabase++;
      } catch (err) {
        console.error(`❌ Failed migrating product ${id}:`, err.message);
        totalFailed++;
        failedUrls.push({ id, name, url: imageUrl, error: err.message });
      }
    }

    // 3. Print verification report
    console.log('\n======================================');
    console.log('         MIGRATION SUMMARY');
    console.log('======================================');
    console.log(`Total Products in Firestore:  ${totalFirestoreProducts}`);
    console.log(`Successfully Uploaded:        ${totalUploadedSupabase}`);
    console.log(`Failed Uploads:               ${totalFailed}`);
    console.log('======================================\n');

    if (totalFailed > 0) {
      console.log('FAILED PRODUCTS DETAIL:');
      failedUrls.forEach(f => {
        console.log(`- ID: ${f.id} | Name: ${f.name}\n  URL: ${f.url}\n  Error: ${f.error || 'Unknown'}`);
      });
      console.log('\n');
    }

    // 4. Mismatch Validation Check
    const checksum = totalUploadedSupabase + totalFailed;
    if (totalFirestoreProducts !== checksum) {
      console.error('🚨 ERROR: CHECKSUM MISMATCH!');
      console.error(`Firestore count (${totalFirestoreProducts}) does not match Sum of Success + Failed (${checksum})`);
      process.exit(1);
    } else {
      console.log('✅ Checksum validated successfully.');
    }

    if (totalFailed > 0) {
      console.error('🚨 WARNING: One or more images failed to migrate. Review errors before proceeding.');
      process.exit(1);
    }

    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY WITH NO ERRORS!');
    process.exit(0);
  } catch (globalError) {
    console.error('🚨 GLOBAL MIGRATION FATAL ERROR:', globalError);
    process.exit(1);
  }
}

migrate();
