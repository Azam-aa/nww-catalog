import { db } from './config';
import {
  collection, query, where, orderBy,
  limit, startAfter, getDocs, addDoc, serverTimestamp,
  updateDoc, deleteDoc, doc
} from 'firebase/firestore';

const PAGE_SIZE = 20;

export async function getProducts({ category, subCategory, lastDoc = null }) {
  let q = query(
    collection(db, 'products'),
    where('category', '==', category),
    where('subCategory', '==', subCategory),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));
  
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === PAGE_SIZE;
  
  return { products, lastVisible, hasMore };
}

export async function addProduct(data) {
  return addDoc(collection(db, 'products'), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(id, data) {
  const docRef = doc(db, 'products', id);
  return updateDoc(docRef, { ...data });
}

export async function deleteProduct(id) {
  const docRef = doc(db, 'products', id);
  return deleteDoc(docRef);
}
