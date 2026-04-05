/**
 * NWW Bulk Product Import Script
 * 
 * Reads products from CSV, uploads images to Cloudinary,
 * and stores product data in Firebase Firestore.
 * 
 * Usage:
 *   node bulk-import.js              # Full import
 *   node bulk-import.js --dry-run    # Validate only, no uploads
 *   node bulk-import.js --resume     # Resume from last checkpoint
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import chalk from 'chalk';
import ora from 'ora';

// ─── Config ────────────────────────────────────────────────────
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT_PATH,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  IMAGES_FOLDER = './images',
  CSV_FILE = './products.csv',
} = process.env;

const DRY_RUN = process.argv.includes('--dry-run');
const RESUME = process.argv.includes('--resume');
const PROGRESS_FILE = './progress.json';
const CONCURRENCY = 3; // Simultaneous image uploads
const MAX_RETRIES = 3;

// ─── Valid categories (must match your app's categories.js) ────
const VALID_CATEGORIES = {
  almari: ['single-door', 'double-door', 'triple-door', 'office-almari', 'wall-doors'],
  cots: ['up-down-cots', 'sofa-diwan', 'bail-patti', 'nawar-cots', 'single-cots', 'double-cots', 'cot-4.5x6.2', 'cot-5x6.5'],
  chairs: ['metal-chairs', 'study-chairs', 'plastic-chairs'],
  others: ['stools', 'racks', 'tables', 'misc'],
};

// ─── Firebase Init ─────────────────────────────────────────────
let db;
function initFirebase() {
  const serviceAccountPath = path.resolve(FIREBASE_SERVICE_ACCOUNT_PATH);
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(chalk.red(`\n✗ Firebase service account key not found at: ${serviceAccountPath}`));
    console.error(chalk.yellow(`\n  To get it:`));
    console.error(chalk.gray(`  1. Go to https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/settings/serviceaccounts/adminsdk`));
    console.error(chalk.gray(`  2. Click "Generate new private key"`));
    console.error(chalk.gray(`  3. Save the file as: bulk-import/service-account-key.json\n`));
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({
    credential: cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });
  db = getFirestore();
}

// ─── CSV Reader ────────────────────────────────────────────────
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ─── Image Upload to Cloudinary ────────────────────────────────
async function uploadToCloudinary(imagePath, folder, retries = 0) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `products/${folder}`);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000;
      console.log(chalk.yellow(`  ↻ Retrying upload for ${path.basename(imagePath)} in ${delay / 1000}s... (attempt ${retries + 2}/${MAX_RETRIES + 1})`));
      await new Promise(r => setTimeout(r, delay));
      return uploadToCloudinary(imagePath, folder, retries + 1);
    }
    throw error;
  }
}

// ─── Concurrent Upload Helper ──────────────────────────────────
async function uploadImagesWithConcurrency(imagePaths, folder) {
  const results = [];
  const queue = [...imagePaths];

  async function worker() {
    while (queue.length > 0) {
      const imgPath = queue.shift();
      const url = await uploadToCloudinary(imgPath, folder);
      results.push({ path: imgPath, url });
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
  await Promise.all(workers);

  // Return URLs in original order
  return imagePaths.map(p => results.find(r => r.path === p).url);
}

// ─── Progress Tracking ─────────────────────────────────────────
function loadProgress() {
  if (RESUME && fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    return new Set(data.completed || []);
  }
  return new Set();
}

function saveProgress(completed) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    completed: [...completed],
    lastUpdated: new Date().toISOString(),
  }, null, 2));
}

// ─── Validation ────────────────────────────────────────────────
function validateRow(row, index, imagesDir) {
  const errors = [];
  const rowNum = index + 2; // +1 for 0-index, +1 for header

  if (!row.product_id?.trim()) errors.push(`Row ${rowNum}: Missing product_id`);
  if (!row.name?.trim()) errors.push(`Row ${rowNum}: Missing name`);
  if (!row.category?.trim()) errors.push(`Row ${rowNum}: Missing category`);
  if (!row.subCategory?.trim()) errors.push(`Row ${rowNum}: Missing subCategory`);

  // Validate category/subcategory
  if (row.category && !VALID_CATEGORIES[row.category]) {
    errors.push(`Row ${rowNum}: Invalid category "${row.category}". Valid: ${Object.keys(VALID_CATEGORIES).join(', ')}`);
  } else if (row.category && row.subCategory && !VALID_CATEGORIES[row.category]?.includes(row.subCategory)) {
    errors.push(`Row ${rowNum}: Invalid subCategory "${row.subCategory}" for "${row.category}". Valid: ${VALID_CATEGORIES[row.category].join(', ')}`);
  }

  // Validate prices
  if (row.selling_price && isNaN(Number(row.selling_price))) {
    errors.push(`Row ${rowNum}: selling_price "${row.selling_price}" is not a number`);
  }
  if (row.cost_price && isNaN(Number(row.cost_price))) {
    errors.push(`Row ${rowNum}: cost_price "${row.cost_price}" is not a number`);
  }

  // Validate images exist
  if (row.images?.trim()) {
    const imageFiles = row.images.split(',').map(f => f.trim()).filter(Boolean);
    for (const imgFile of imageFiles) {
      const imgPath = path.join(imagesDir, imgFile);
      if (!fs.existsSync(imgPath)) {
        errors.push(`Row ${rowNum}: Image file not found: "${imgFile}" (looked in ${imagesDir})`);
      }
    }
  }

  return errors;
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   NWW Bulk Product Import Tool           ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝'));

  if (DRY_RUN) {
    console.log(chalk.yellow('\n🔍 DRY RUN MODE — No uploads or writes will happen\n'));
  }

  // ── Step 1: Read CSV ──
  const csvPath = path.resolve(CSV_FILE);
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red(`✗ CSV file not found: ${csvPath}`));
    process.exit(1);
  }

  const spinner = ora('Reading CSV file...').start();
  const rows = await readCSV(csvPath);
  spinner.succeed(chalk.green(`Read ${rows.length} products from CSV`));

  // Filter out empty rows
  const products = rows.filter(r => r.product_id?.trim());
  console.log(chalk.gray(`  (${rows.length - products.length} empty rows skipped)`));

  // ── Step 2: Validate all rows ──
  const imagesDir = path.resolve(IMAGES_FOLDER);
  console.log(chalk.gray(`  Images folder: ${imagesDir}`));

  const allErrors = [];
  const productIds = new Set();

  for (let i = 0; i < products.length; i++) {
    // Check duplicates
    if (productIds.has(products[i].product_id)) {
      allErrors.push(`Row ${i + 2}: Duplicate product_id "${products[i].product_id}"`);
    }
    productIds.add(products[i].product_id);

    const rowErrors = validateRow(products[i], i, imagesDir);
    allErrors.push(...rowErrors);
  }

  if (allErrors.length > 0) {
    console.error(chalk.red(`\n✗ Validation failed with ${allErrors.length} error(s):\n`));
    allErrors.forEach(e => console.error(chalk.red(`  • ${e}`)));
    console.error(chalk.yellow(`\nFix these errors in your CSV and re-run.\n`));
    process.exit(1);
  }

  console.log(chalk.green(`✓ All ${products.length} rows passed validation`));

  // Count total images
  const totalImages = products.reduce((sum, p) => {
    const imgs = p.images?.split(',').map(f => f.trim()).filter(Boolean) || [];
    return sum + imgs.length;
  }, 0);
  console.log(chalk.gray(`  Total images to upload: ${totalImages}`));

  if (DRY_RUN) {
    console.log(chalk.green('\n✓ Dry run complete. Everything looks good!\n'));
    process.exit(0);
  }

  // ── Step 3: Initialize Firebase ──
  const fbSpinner = ora('Connecting to Firebase...').start();
  initFirebase();
  fbSpinner.succeed(chalk.green('Connected to Firebase'));

  // ── Step 4: Load progress (for resume) ──
  const completedProducts = loadProgress();
  if (completedProducts.size > 0) {
    console.log(chalk.yellow(`  ↻ Resuming: ${completedProducts.size} products already completed`));
  }

  // ── Step 5: Process each product ──
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(chalk.bold('\n── Starting Import ──\n'));

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productId = product.product_id;
    const progress = `[${i + 1}/${products.length}]`;

    // Skip if already completed (resume mode)
    if (completedProducts.has(productId)) {
      console.log(chalk.gray(`${progress} ⊘ Skipping ${productId} (already done)`));
      skipCount++;
      continue;
    }

    try {
      process.stdout.write(chalk.blue(`${progress} ↑ ${productId}... `));

      // Upload images
      const imageFiles = product.images?.split(',').map(f => f.trim()).filter(Boolean) || [];
      const imagePaths = imageFiles.map(f => path.join(imagesDir, f));
      const imageUrls = await uploadImagesWithConcurrency(imagePaths, product.category);

      // Calculate margin
      const sellingPrice = Number(product.selling_price) || 0;
      const costPrice = Number(product.cost_price) || 0;
      const margin = sellingPrice - costPrice;

      // Build Firestore document
      const docData = {
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        typeCode: product.typeCode || '',
        weightType: product.weightType || '',
        material: product.material || '',
        color: product.color || '',
        size: product.size || '',
        description: product.description || '',
        price: sellingPrice,
        costPrice: costPrice,
        margin: margin,
        imageUrl: imageUrls[0] || '',         // Backward compatible (first image)
        thumbnailUrl: imageUrls[0] || '',     // Thumbnail = first image
        imageUrls: imageUrls,                 // NEW: array of all image URLs
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        importedVia: 'bulk-import',
        productId: productId,
      };

      // Write to Firestore
      await db.collection('products').add(docData);

      // Track progress
      completedProducts.add(productId);
      saveProgress(completedProducts);

      console.log(chalk.green(`✓ (${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''})`));
      successCount++;

    } catch (err) {
      console.log(chalk.red(`✗ ${err.message}`));
      errors.push({ productId, error: err.message });
      errorCount++;
    }
  }

  // ── Summary ──
  console.log(chalk.bold('\n══ Import Summary ══\n'));
  console.log(chalk.green(`  ✓ Success:  ${successCount}`));
  if (skipCount > 0) console.log(chalk.gray(`  ⊘ Skipped:  ${skipCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`  ✗ Failed:   ${errorCount}`));
    console.log(chalk.red('\n  Failed products:'));
    errors.forEach(e => console.log(chalk.red(`    • ${e.productId}: ${e.error}`)));
  }
  console.log();

  // Clean up progress file on full success
  if (errorCount === 0 && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log(chalk.gray('  Cleaned up progress file.'));
  }

  console.log(chalk.bold.cyan('Done! 🎉\n'));
}

main().catch(err => {
  console.error(chalk.red('\nFatal error:'), err);
  process.exit(1);
});
