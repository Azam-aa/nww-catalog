import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the service account key
const serviceAccountPath = path.join(__dirname, 'service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(chalk.red('Error: service-account-key.json not found in bulk-import/ directory.'));
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The new curated structure requested by the user
const CATEGORIES = [
  {
    id: 'almari',
    label: 'Almirahs & Storage',
    icon: 'cabinet',
    subCategories: [
      { id: 'sd-lw', label: 'SD Almari (LW)', typeCode: 'salw', weightTypes: [] },
      { id: 'sd-mh', label: 'SD Almari (MH)', typeCode: 'samh', weightTypes: [] },
      { id: 'sd-h', label: 'SD Almari (H)', typeCode: 'sah', weightTypes: [] },
      { id: 'dd-lw', label: 'DD Almari (LW)', typeCode: 'dalw', weightTypes: [] },
      { id: 'dd-mh', label: 'DD Almari (MH)', typeCode: 'damh', weightTypes: [] },
      { id: 'dd-h', label: 'DD Almari (H)', typeCode: 'dah', weightTypes: [] },
      { id: 'td-lw', label: 'TD Almari (LW)', typeCode: 'talw', weightTypes: [] },
      { id: 'td-mh', label: 'TD Almari (MH)', typeCode: 'tamh', weightTypes: [] },
      { id: 'td-h', label: 'TD Almari (H)', typeCode: 'tah', weightTypes: [] },
      { id: 'office', label: 'Office Almari', typeCode: 'ofa', weightTypes: [] },
      { id: 'wall-doors', label: 'Wall Doors', typeCode: 'wd', weightTypes: [] },
      { id: 'trunks', label: 'Trunks', typeCode: 'tr', weightTypes: [] },
      { id: 'racks', label: 'Racks', typeCode: 'rk', weightTypes: [] },
    ]
  },
  {
    id: 'cots',
    label: 'Cots & Beds',
    icon: 'bed',
    subCategories: [
      { id: 'up-down', label: 'Up & Down Cots', typeCode: 'udc', weightTypes: [] },
      { id: 'sofa-diwan', label: 'Sofa & Diwan cot', typeCode: 'sdc', weightTypes: [] },
      { id: 'bail-patti', label: 'Bail patti cots', typeCode: 'bpc', weightTypes: [] },
      { id: 'nawar', label: 'Nawar Cots', typeCode: 'nwc', weightTypes: [] },
      { id: 'single-rm', label: 'Single Cots (RM)', typeCode: 'scrm', weightTypes: [] },
      { id: 'single-h', label: 'Single Cots (H)', typeCode: 'sch', weightTypes: [] },
      { id: 'double-rm', label: 'Double cots (RM)', typeCode: 'dcrm', weightTypes: [] },
      { id: 'double-mh', label: 'Double cots (MH)', typeCode: 'dcmh', weightTypes: [] },
      { id: 'four-and-half', label: '4½\'×6\'.2" cots (H)', typeCode: 'cfh', weightTypes: [] },
      { id: 'five-by-six', label: '5\'×6½\' cots (H)', typeCode: 'cfv', weightTypes: [] },
    ]
  },
  {
    id: 'furniture',
    label: 'Tables & Seating',
    icon: 'armchair',
    subCategories: [
      { id: 'metal-chairs', label: 'Metal chairs', typeCode: 'mc', weightTypes: [] },
      { id: 'study-chairs', label: 'Study Chairs', typeCode: 'sc', weightTypes: [] },
      { id: 'plastic-chairs', label: 'Plastic Chairs', typeCode: 'pc', weightTypes: [] },
      { id: 'plastic-stools', label: 'Plastic Stools', typeCode: 'ps', weightTypes: [] },
      { id: 'ladders-stools', label: 'Ladders & Stools', typeCode: 'ls', weightTypes: [] },
      { id: 'dressing-tables', label: 'Dressing Tables', typeCode: 'dt', weightTypes: [] },
      { id: 'dining-tables', label: 'Dining Table', typeCode: 'dnt', weightTypes: [] },
    ]
  }
];

async function run() {
  console.log(chalk.blue('Starting category re-seed...'));
  try {
    // 1. Delete all old categories
    console.log(chalk.yellow('Deleting old categories...'));
    const snapshot = await db.collection('categories').get();
    const batchDelete = db.batch();
    snapshot.docs.forEach(doc => {
      batchDelete.delete(doc.ref);
    });
    await batchDelete.commit();

    // 2. Add new categories
    console.log(chalk.yellow('Inserting new categories...'));
    const batchAdd = db.batch();
    CATEGORIES.forEach((cat, index) => {
      const docRef = db.collection('categories').doc(cat.id);
      batchAdd.set(docRef, { ...cat, order: index });
    });
    await batchAdd.commit();

    console.log(chalk.green('✓ Successfully re-seeded categories. Check your Admin Panel!'));
    process.exit(0);
  } catch (err) {
    console.error(chalk.red('Migration failed:'), err);
    process.exit(1);
  }
}

run();
