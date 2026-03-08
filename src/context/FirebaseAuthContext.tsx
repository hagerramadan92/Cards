"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { clearFirebaseSession, resetFirebase } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setAuthFromApi, isAuthenticated, registerFirebaseLogout } = useAuth(); // ✅ إضافة registerFirebaseLogout
  const { language } = useLanguage();
  
  const isLoggingOut = useRef(false);
  const autoLoginBlocked = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const logoutInProgress = useRef(false);

  // ✅ تسجيل دالة logout في AuthContext
  useEffect(() => {
    if (registerFirebaseLogout) {
      registerFirebaseLogout(firebaseLogout);
    }
  }, [registerFirebaseLogout]);

  useEffect(() => {
    if (!auth) return;

    // إلغاء الاشتراك السابق
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // إنشاء اشتراك جديد
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase auth state changed:", firebaseUser?.email, {
        isLoggingOut: isLoggingOut.current,
        autoLoginBlocked: autoLoginBlocked.current,
        logoutInProgress: logoutInProgress.current,
        timestamp: new Date().toISOString()
      });
      
      // ✅ إذا كان logout قيد التنفيذ، تجاهل كل شيء
      if (logoutInProgress.current) {
        console.log("🚫 Logout in progress, ignoring auth change");
        setUser(null);
        return;
      }
      
      // ✅ إذا كنا في حالة logout، لا تفعل شيئاً
      if (isLoggingOut.current) {
        console.log("🚫 Currently logging out, ignoring auth state change");
        setUser(null);
        return;
      }

      // ✅ إذا كان auto login محظور (بعد logout)، لا تفعل شيئاً
      if (autoLoginBlocked.current) {
        console.log("🚫 Auto login blocked, ignoring");
        setUser(null);
        return;
      }
      
      setUser(firebaseUser);
      setLoading(false);
      
      // ✅ تحقق إضافي: إذا كان هناك مستخدم في Firebase ولكن لا يوجد token في localStorage
      const localToken = localStorage.getItem("auth_token");
      
      if (firebaseUser && 
          !isAuthenticated && 
          !localToken && 
          !autoLoginBlocked.current && 
          !isLoggingOut.current &&
          !logoutInProgress.current) {
        
        try {
          console.log("🔄 Attempting auto login...");
          
          const payload = {
            provider: "google",
            provider_id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "User",
          };

          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          const response = await fetch(`${apiUrl}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Language": language || "ar",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          
          if (response.ok && data.status && data.data?.token) {
            setAuthFromApi({
              token: data.data.token,
              name: data.data.user?.name || firebaseUser.displayName || "مستخدم",
              email: data.data.user?.email || firebaseUser.email || "",
              image: data.data.user?.image || firebaseUser.photoURL || "",
              fullName: data.data.user?.name || firebaseUser.displayName || "مستخدم"
            }, false);
          }
        } catch (error) {
          console.error("❌ Auto login error:", error);
        }
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setAuthFromApi, isAuthenticated, language]);

 // دالة logout مخصصة لـ Firebase
const firebaseLogout = async () => {
  // ✅ منع التنفيذ المتكرر
  if (logoutInProgress.current) {
    console.log("⏳ Logout already in progress");
    return;
  }
  
  console.log("🚀 Starting Firebase logout process...");
  
  logoutInProgress.current = true;
  autoLoginBlocked.current = true;
  isLoggingOut.current = true;
  
  try {
    // 1. إلغاء الاشتراك أولاً
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // 2. إعادة تعيين حالة المستخدم
    setUser(null);
    
    // 3. محاولة تسجيل الخروج من Firebase
    try {
      if (auth) {
        await firebaseSignOut(auth);
        console.log("✅ Firebase signOut successful");
      }
    } catch (signOutError) {
      console.log("⚠️ Firebase signOut error (continuing anyway):", signOutError);
    }
    
    // 4. مسح Firebase session بالكامل - مع تحسين الأداء
    try {
      // لا ننتظر اكتمال مسح IndexedDB بالكامل
      clearFirebaseSession().catch(e => 
        console.log("⚠️ Background Firebase session clear warning:", e)
      );
      console.log("✅ Firebase session clear initiated");
    } catch (clearError) {
      console.log("⚠️ Error initiating Firebase session clear:", clearError);
    }
    
    // 5. إعادة تعيين Firebase
    try {
      resetFirebase();
      console.log("✅ Firebase reset");
    } catch (resetError) {
      console.log("⚠️ Error resetting Firebase:", resetError);
    }
    
    console.log("✅ Firebase logout completed successfully");
    
  } catch (error) {
    console.error("❌ Firebase logout error:", error);
  } finally {
    logoutInProgress.current = false;
    // autoLoginBlocked.current يبقى true لمنع auto login
  }
};

  const getIdToken = async (): Promise<string | null> => {
    if (!user || autoLoginBlocked.current || isLoggingOut.current || logoutInProgress.current) {
      return null;
    }
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: firebaseLogout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return context;
};