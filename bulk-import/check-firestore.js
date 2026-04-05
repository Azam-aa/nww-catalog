import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

try {
  const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  async function check() {
    const snap = await db.collection('categories').get();
    console.log("Categories in Firestore:");
    snap.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().label} (${doc.data().subCategories?.length} types)`);
    });
    process.exit(0);
  }
  
  check();
} catch (error) {
  console.error("Setup Error:", error.message);
  process.exit(1);
}
