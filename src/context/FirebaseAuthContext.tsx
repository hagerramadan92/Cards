"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { clearFirebaseSession, resetFirebase } from "@/lib/firebase";
import { postSocialLogin, SocialLoginError } from "@/utils/socialLogin";

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
    
      // ✅ إذا كان logout قيد التنفيذ، تجاهل كل شيء
      if (logoutInProgress.current) {
        
        setUser(null);
        return;
      }
      
      // ✅ إذا كنا في حالة logout، لا تفعل شيئاً
      if (isLoggingOut.current) {
       
        setUser(null);
        return;
      }

      // ✅ إذا كان auto login محظور (بعد logout)، لا تفعل شيئاً
      if (autoLoginBlocked.current) {
       
        setUser(null);
        return;
      }
      
      setUser(firebaseUser);
      setLoading(false);
      
      // ✅ تحقق إضافي: إذا كان هناك مستخدم في Firebase ولكن لا يوجد token في localStorage
      const localToken = localStorage.getItem("auth_token");
      const googleLoginInProgress = sessionStorage.getItem("google_login_in_progress") === "true";
      
      if (firebaseUser && 
          !isAuthenticated && 
          !localToken && 
          !googleLoginInProgress &&
          !autoLoginBlocked.current && 
          !isLoggingOut.current &&
          !logoutInProgress.current) {
        
        try {
         
          
          const payload = {
            provider: "google",
            provider_id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "User",
            image: firebaseUser.photoURL || "",
          };

          const data = await postSocialLogin(payload, language || "ar");
          
          if (data.data?.token) {
            setAuthFromApi({
              token: data.data.token,
              name: data.data.user?.name || firebaseUser.displayName || "مستخدم",
              email: data.data.user?.email || firebaseUser.email || "",
              image: data.data.user?.image || firebaseUser.photoURL || "",
              fullName: data.data.user?.name || firebaseUser.displayName || "مستخدم"
            }, false);
          }
        } catch (error) {
          if (error instanceof SocialLoginError) {
            console.error("❌ Auto login failed:", {
              message: error.message,
              status: error.status,
              statusText: error.statusText,
              data: error.data,
              rawBody: error.rawBody,
            });
            return;
          }

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
    
    return;
  }
  

  
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
       
      }
    } catch (signOutError) {
      
    }
    
    // 4. مسح Firebase session بالكامل - مع تحسين الأداء
    try {
      // لا ننتظر اكتمال مسح IndexedDB بالكامل
      clearFirebaseSession().catch(e => 
        console.log("⚠️ Background Firebase session clear warning:", e)
      );
     
    } catch (clearError) {
     
    }
    
    // 5. إعادة تعيين Firebase
    try {
      resetFirebase();
    
    } catch (resetError) {
      
    }
    
   
    
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
