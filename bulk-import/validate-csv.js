/**
 * CSV Validator for NWW Bulk Import
 * 
 * Validates your CSV file and images before actually importing.
 * Run this first to catch errors early.
 * 
 * Usage: node validate-csv.js
 *        node validate-csv.js --csv=myfile.csv --images=./my-images
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import chalk from 'chalk';

const CSV_FILE = process.env.CSV_FILE || './products.csv';
const IMAGES_FOLDER = process.env.IMAGES_FOLDER || './images';

// Parse CLI overrides
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--csv=')) process.env.CSV_FILE = arg.split('=')[1];
  if (arg.startsWith('--images=')) process.env.IMAGES_FOLDER = arg.split('=')[1];
}

const VALID_CATEGORIES = {
  almari: ['single-door', 'double-door', 'triple-door', 'office-almari', 'wall-doors'],
  cots: ['up-down-cots', 'sofa-diwan', 'bail-patti', 'nawar-cots', 'single-cots', 'double-cots', 'cot-4.5x6.2', 'cot-5x6.5'],
  chairs: ['metal-chairs', 'study-chairs', 'plastic-chairs'],
  others: ['stools', 'racks', 'tables', 'misc'],
};

const REQUIRED_COLUMNS = ['product_id', 'name', 'category', 'subCategory', 'cost_price', 'selling_price', 'images'];

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

async function validate() {
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   NWW CSV Validator                      ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════╝\n'));

  const csvPath = path.resolve(CSV_FILE);
  const imagesDir = path.resolve(IMAGES_FOLDER);

  // Check CSV exists
  if (!fs.existsSync(csvPath)) {
    console.error(chalk.red(`✗ CSV file not found: ${csvPath}`));
    process.exit(1);
  }

  console.log(chalk.gray(`  CSV:    ${csvPath}`));
  console.log(chalk.gray(`  Images: ${imagesDir}\n`));

  const rows = await readCSV(csvPath);
  const products = rows.filter(r => r.product_id?.trim());

  console.log(chalk.blue(`  Total rows: ${rows.length} (${products.length} with data)\n`));

  // Check columns
  if (products.length > 0) {
    const columns = Object.keys(products[0]);
    const missingCols = REQUIRED_COLUMNS.filter(c => !columns.includes(c));
    if (missingCols.length > 0) {
      console.error(chalk.red(`✗ Missing required columns: ${missingCols.join(', ')}`));
      console.error(chalk.gray(`  Found columns: ${columns.join(', ')}\n`));
      process.exit(1);
    }
    console.log(chalk.green(`✓ All required columns present`));
  }

  const errors = [];
  const warnings = [];
  const productIds = new Set();
  let totalImages = 0;
  let missingImages = 0;

  // Per-category counts
  const categoryCounts = {};

  for (let i = 0; i < products.length; i++) {
    const row = products[i];
    const rowNum = i + 2;

    // Duplicates
    if (productIds.has(row.product_id)) {
      errors.push(`Row ${rowNum}: Duplicate product_id "${row.product_id}"`);
    }
    productIds.add(row.product_id);

    // Required fields
    if (!row.name?.trim()) errors.push(`Row ${rowNum}: Missing name`);
    if (!row.category?.trim()) errors.push(`Row ${rowNum}: Missing category`);
    if (!row.subCategory?.trim()) errors.push(`Row ${rowNum}: Missing subCategory`);

    // Category validation
    if (row.category && !VALID_CATEGORIES[row.category]) {
      errors.push(`Row ${rowNum}: Invalid category "${row.category}"`);
    } else if (row.category && row.subCategory && !VALID_CATEGORIES[row.category]?.includes(row.subCategory)) {
      errors.push(`Row ${rowNum}: Invalid subCategory "${row.subCategory}" for "${row.category}"`);
    }

    // Price validation
    if (!row.selling_price?.trim()) warnings.push(`Row ${rowNum}: Missing selling_price`);
    else if (isNaN(Number(row.selling_price))) errors.push(`Row ${rowNum}: Invalid selling_price "${row.selling_price}"`);
    
    if (!row.cost_price?.trim()) warnings.push(`Row ${rowNum}: Missing cost_price`);
    else if (isNaN(Number(row.cost_price))) errors.push(`Row ${rowNum}: Invalid cost_price "${row.cost_price}"`);

    // Margin check
    if (row.selling_price && row.cost_price) {
      const margin = Number(row.selling_price) - Number(row.cost_price);
      if (margin < 0) warnings.push(`Row ${rowNum}: Negative margin (₹${margin}) for "${row.product_id}"`);
    }

    // Image validation
    if (row.images?.trim()) {
      const imageFiles = row.images.split(',').map(f => f.trim()).filter(Boolean);
      totalImages += imageFiles.length;
      for (const imgFile of imageFiles) {
        const imgPath = path.join(imagesDir, imgFile);
        if (!fs.existsSync(imgPath)) {
          errors.push(`Row ${rowNum}: Image not found "${imgFile}"`);
          missingImages++;
        }
      }
    } else {
      warnings.push(`Row ${rowNum}: No images specified for "${row.product_id}"`);
    }

    // Track category distribution
    const catKey = `${row.category}/${row.subCategory}`;
    categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;
  }

  // ── Results ──
  console.log(chalk.blue(`\n── Category Distribution ──\n`));
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(chalk.gray(`  ${cat}: ${count} product${count > 1 ? 's' : ''}`));
  }

  console.log(chalk.blue(`\n── Image Summary ──\n`));
  console.log(chalk.gray(`  Total images referenced: ${totalImages}`));
  console.log(chalk.gray(`  Missing images: ${missingImages}`));

  console.log(chalk.blue(`\n── Validation Results ──\n`));

  if (warnings.length > 0) {
    console.log(chalk.yellow(`⚠ ${warnings.length} warning(s):`));
    warnings.forEach(w => console.log(chalk.yellow(`  • ${w}`)));
    console.log();
  }

  if (errors.length > 0) {
    console.log(chalk.red(`✗ ${errors.length} error(s):`));
    errors.forEach(e => console.log(chalk.red(`  • ${e}`)));
    console.log(chalk.red(`\nFix these errors before running the import.\n`));
    process.exit(1);
  }

  console.log(chalk.green(`✓ All ${products.length} products validated successfully!`));
  console.log(chalk.green(`  Ready to import. Run: npm run import\n`));
}

validate().catch(err => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
