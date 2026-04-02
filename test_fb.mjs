import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";

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
const db = getFirestore(app);

async function testFirebase() {
  console.log("Connecting to Firestore Database...");
  
  // Create a timeout so it doesn't hang forever in Node
  const timeoutId = setTimeout(() => {
    console.error("TIMEOUT ERROR: Database did not respond after 10 seconds.");
    console.error("Diagnosis: The Firestore Database likely hasn't been created in the Firebase Console yet, or rules are deeply broken.");
    process.exit(1);
  }, 10000);

  try {
    await addDoc(collection(db, 'test_ping'), { time: new Date() });
    clearTimeout(timeoutId);
    console.log("SUCCESS! Database wrote properly.");
    process.exit(0);
  } catch(e) {
    clearTimeout(timeoutId);
    console.error("FIREBASE THREW ERROR:", e);
    process.exit(1);
  }
}

testFirebase();
