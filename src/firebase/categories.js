import { db } from './config';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, orderBy, query 
} from 'firebase/firestore';

const COLLECTION_NAME = 'categories';

export async function getCategories() {
  const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addCategory(id, data) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, data);
  return id;
}

export async function updateCategory(id, data) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, data, { merge: true });
}

export async function deleteCategory(id) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function seedCategories(defaultCategories) {
  const batch = writeBatch(db);
  defaultCategories.forEach((cat, index) => {
    const docRef = doc(db, COLLECTION_NAME, cat.id);
    batch.set(docRef, { ...cat, order: index });
  });
  await batch.commit();
}
