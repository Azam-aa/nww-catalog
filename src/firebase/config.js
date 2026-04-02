import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCmwys28S7fVSqGP0WJGeD9dj3m_ow2v5Q",
  authDomain: "nww-catalog1.firebaseapp.com",
  projectId: "nww-catalog1",
  storageBucket: "nww-catalog1.firebasestorage.app",
  messagingSenderId: "901718994508",
  appId: "1:901718994508:web:3e0cb83e0345d4ee310ee9",
  measurementId: "G-WYP786CKPT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
