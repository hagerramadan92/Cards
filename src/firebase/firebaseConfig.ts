// src/firebase/firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAeQNbYK4HGZU3OUAEb8O7ciAn67s2Siqo",
  authDomain: "cards-728c1.firebaseapp.com",
  projectId: "cards-728c1",
  storageBucket: "cards-728c1.firebasestorage.app",
  messagingSenderId: "228725862015",
  appId: "1:228725862015:web:56a76cd644399f9a73994a",
  measurementId: "G-325Y2PG15D"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
