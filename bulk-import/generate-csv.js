/**
 * CSV Generator for NWW Bulk Import
 * 
 * Scans the images/ folder and generates a starter CSV
 * with product IDs extracted from filenames.
 * 
 * Expected image naming: {category}-{typeCode}-{number}_{imageIndex}.jpg
 * Example: almari-SD-001_1.jpg → product_id = "almari-SD-001"
 * 
 * Usage: node generate-csv.js
 *        node generate-csv.js --images=./path-to-images --output=./my-products.csv
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const IMAGES_FOLDER = process.env.IMAGES_FOLDER || './images';
const OUTPUT_FILE = './products_generated.csv';

// Category → typeCode mapping (reverse)
const TYPE_CODE_MAP = {
  SD: { category: 'almari', subCategory: 'single-door' },
  DD: { category: 'almari', subCategory: 'double-door' },
  TD: { category: 'almari', subCategory: 'triple-door' },
  OA: { category: 'almari', subCategory: 'office-almari' },
  WD: { category: 'almari', subCategory: 'wall-doors' },
  UDC: { category: 'cots', subCategory: 'up-down-cots' },
  SDC: { category: 'cots', subCategory: 'sofa-diwan' },
  BPC: { category: 'cots', subCategory: 'bail-patti' },
  NC: { category: 'cots', subCategory: 'nawar-cots' },
  SC: { category: 'cots', subCategory: 'single-cots' },
  DC: { category: 'cots', subCategory: 'double-cots' },
  C1: { category: 'cots', subCategory: 'cot-4.5x6.2' },
  C2: { category: 'cots', subCategory: 'cot-5x6.5' },
  MC: { category: 'chairs', subCategory: 'metal-chairs' },
  STC: { category: 'chairs', subCategory: 'study-chairs' },
  PC: { category: 'chairs', subCategory: 'plastic-chairs' },
  ST: { category: 'others', subCategory: 'stools' },
  RK: { category: 'others', subCategory: 'racks' },
  TB: { category: 'others', subCategory: 'tables' },
  MS: { category: 'others', subCategory: 'misc' },
};

function run() {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   NWW CSV Generator                      ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));

  const imagesDir = path.resolve(IMAGES_FOLDER);

  if (!fs.existsSync(imagesDir)) {
    console.error(chalk.red(`✗ Images folder not found: ${imagesDir}`));
    console.error(chalk.yellow(`  Create the folder and put your renamed images in it.\n`));
    process.exit(1);
  }

  // Scan image files
  const files = fs.readdirSync(imagesDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  console.log(chalk.gray(`  Found ${files.length} image files in ${imagesDir}\n`));

  if (files.length === 0) {
    console.error(chalk.red(`✗ No image files found. Add images to: ${imagesDir}`));
    process.exit(1);
  }

  // Group by product_id (everything before _N)
  const productMap = new Map();

  for (const file of files) {
    // Extract product ID: "almari-SD-001_1.jpg" → "almari-SD-001"
    const match = file.match(/^(.+?)_(\d+)\.\w+$/);
    if (!match) {
      console.warn(chalk.yellow(`  ⚠ Skipping "${file}" — doesn't match pattern {id}_{number}.ext`));
      continue;
    }

    const productId = match[1];
    if (!productMap.has(productId)) {
      productMap.set(productId, []);
    }
    productMap.get(productId).push(file);
  }

  console.log(chalk.green(`  Grouped into ${productMap.size} products\n`));

  // Generate CSV content
  const header = 'product_id,name,category,subCategory,typeCode,weightType,material,color,size,description,cost_price,selling_price,images';
  const rows = [];

  for (const [productId, images] of productMap) {
    // Try to auto-detect category from product_id
    // Format: {category}-{typeCode}-{number}
    const parts = productId.split('-');
    let category = '';
    let subCategory = '';
    let typeCode = '';

    if (parts.length >= 2) {
      const tc = parts[1]; // second part is typeCode
      const mapping = TYPE_CODE_MAP[tc];
      if (mapping) {
        category = mapping.category;
        subCategory = mapping.subCategory;
        typeCode = tc;
      }
    }

    const imageList = images.join(',');
    rows.push(`${productId},,${category},${subCategory},${typeCode},,,,,,,,"${imageList}"`);
  }

  const csvContent = [header, ...rows].join('\n') + '\n';
  fs.writeFileSync(OUTPUT_FILE, csvContent);

  console.log(chalk.green(`✓ Generated CSV: ${OUTPUT_FILE}`));
  console.log(chalk.gray(`  ${productMap.size} products with ${files.length} total images`));
  console.log(chalk.yellow(`\n  Next steps:`));
  console.log(chalk.gray(`  1. Open ${OUTPUT_FILE} in Excel`));
  console.log(chalk.gray(`  2. Fill in: name, material, color, size, cost_price, selling_price`));
  console.log(chalk.gray(`  3. Save as CSV`));
  console.log(chalk.gray(`  4. Copy to products.csv`));
  console.log(chalk.gray(`  5. Run: npm run validate`));
  console.log(chalk.gray(`  6. Run: npm run import\n`));
}

run();
