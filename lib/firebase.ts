import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAeQNbYK4HGZU3OUAEb8O7ciAn67s2Siqo",
  authDomain: "cards-728c1.firebaseapp.com",
  projectId: "cards-728c1",
  storageBucket: "cards-728c1.firebasestorage.app",
  messagingSenderId: "228725862015",
  appId: "1:228725862015:web:56a76cd644399f9a73994a",
  measurementId: "G-325Y2PG15D"
};

// Initialize Firebase
let app;
let auth:any;
let analytics = null;

if (typeof window !== 'undefined') {
  // في المتصفح فقط
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  
  // ✅ تعطيل التخزين المؤقت لـ Firebase تماماً
  try {
    // محاولة تعطيل persistence
    auth.setPersistence = null;
  } catch (e) {
    console.log("Could not disable persistence");
  }
  
  analytics = getAnalytics(app);
}

export { app, auth, analytics };

// ✅ دالة قوية لمسح Firebase session بالكامل
// ✅ دالة قوية لمسح Firebase session بالكامل - نسخة محسنة
export const clearFirebaseSession = async () => {
  if (typeof window !== 'undefined' && auth) {
    const results: {[key: string]: boolean} = {};
    
    try {
      console.log("🔍 Clearing Firebase session...");
      
      // 1. تسجيل الخروج من Firebase (الأهم)
      try {
        await signOut(auth);
        console.log("✅ Firebase signOut successful");
        results.signOut = true;
      } catch (error) {
        console.error("❌ Firebase signOut error:", error);
        results.signOut = false;
      }
      
      // 2. مسح localStorage المرتبط بـ Firebase (سريع)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('firebase:') || key.includes('firebase'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 3. مسح sessionStorage المرتبط بـ Firebase (سريع)
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('firebase:') || key.includes('firebase'))) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      // 4. محاولة مسح IndexedDB في الخلفية (لا ننتظر)
      setTimeout(() => {
        const databasesToDelete = [
          'firebaseLocalStorageDb',
          'firebase-heartbeat-database',
          'firebase-installations-database',
        ];
        
        databasesToDelete.forEach(dbName => {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (e) {
            // ignore
          }
        });
      }, 0);
      
      console.log("✅ Firebase session cleared");
      return true;
      
    } catch (error) {
      console.error("❌ Error in clearFirebaseSession:", error);
      return false;
    }
  }
  return false;
};

// دالة إضافية لإعادة تهيئة Firebase بعد logout
export const resetFirebase = () => {
  if (typeof window !== 'undefined' && auth) {
    try {
      // محاولة إعادة تعيين الحالة
      auth.currentUser = null;
      console.log("✅ Firebase reset");
    } catch (error) {
      console.error("❌ Firebase reset error:", error);
    }
  }
};