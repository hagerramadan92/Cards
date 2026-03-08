"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { ProductI } from "../../Types/ProductsI";
import { useLanguage } from "./LanguageContext";
import toast from "react-hot-toast";

const AuthContext = createContext<any | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  
  const { language, t } = useLanguage();

  const [favoriteProducts, setFavoriteProducts] = useState<ProductI[]>([]);
  const [favoriteProductsLoading, setFavoriteProductsLoading] = useState<boolean>(false);

  const { data: session, status } = useSession();
  
  const socialLoginAttempted = useRef(false);
  const socialLoginInProgress = useRef(false);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ متغير لتخزين دالة Firebase logout
  const firebaseLogoutRef = useRef<(() => Promise<void>) | null>(null);

  // ✅ دالة لتسجيل Firebase logout
  const registerFirebaseLogout = (logoutFn: () => Promise<void>) => {
    firebaseLogoutRef.current = logoutFn;
  };

  // التحقق من حالة logout عند تحميل الصفحة
  useEffect(() => {
    const logoutFlag = sessionStorage.getItem("force_logout");
    if (logoutFlag === "true") {
      setIsLoggingOut(true);
      sessionStorage.removeItem("force_logout");
    }
  }, []);

  /* ---------------------- LOAD LOCAL STORAGE + NEXTAUTH USER ---------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLoggingOut) return; 

    const storedToken = localStorage.getItem("auth_token");
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedImage = localStorage.getItem("userImage");
    const storedFullName = localStorage.getItem("fullName");

    if (storedToken && storedToken !== authToken) setAuthToken(storedToken);
    if (storedName && storedName !== userName) setUserName(storedName);
    if (storedEmail && storedEmail !== userEmail) setUserEmail(storedEmail);
    if (storedImage && storedImage !== userImage) setUserImage(storedImage);
    if (storedFullName && storedFullName !== fullName) setFullName(storedFullName);

    // تحديث من NextAuth session فقط إذا لم يكن في حالة logout
    if (!isLoggingOut && status === "authenticated" && session?.user) {
      const name = session.user.name || storedName || "مستخدم";
      const email = session.user.email || storedEmail || null;
      const image = session.user.image || storedImage || "";
      const full = storedFullName || session.user.name || "مستخدم";

      if (name !== userName) setUserName(name);
      if (email !== userEmail) setUserEmail(email);
      if (image !== userImage) setUserImage(image);
      if (full !== fullName) setFullName(full);

      localStorage.setItem("userName", name);
      if (email) localStorage.setItem("userEmail", email);
      if (image) localStorage.setItem("userImage", image);
      localStorage.setItem("fullName", full);
    }
  }, [session, status, isLoggingOut]);

  /* ---------------------- SOCIAL LOGIN BACKEND SYNC ---------------------- */
  useEffect(() => {
    if (isLoggingOut) return;
    if (socialLoginAttempted.current || socialLoginInProgress.current) return;
    if (status !== "authenticated" || !session?.user) return;
    if (authToken) return;

    // تحقق من أن عملية تسجيل الدخول بدأت من جوجل
    const googleInProgress = typeof window !== "undefined" && 
      sessionStorage.getItem("google_login_in_progress");
    
    console.log("Google login in progress:", googleInProgress);

    const user = session.user as any;

    if (user.provider_id || googleInProgress) {
      socialLoginInProgress.current = true;
      
      const syncSocialLogin = async () => {
        const payload = {
          provider: (user.provider || "google").toLowerCase(),
          provider_id: String(user.provider_id || user.id || ""),
          email: user.email || "",
          name: user.name || "User",
        };

        console.log("Syncing social login with payload:", payload);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          console.log("API URL:", apiUrl);

          const res = await fetch(`${apiUrl}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Language": language || "ar",
            },
            body: JSON.stringify(payload),
          });

          console.log("API Response Status:", res.status);

          const data = await res.json();
          console.log("API Response Data:", data);

          if (res.ok && data.status && data.data?.token) {
            const token = data.data.token;
            
            localStorage.setItem("auth_token", token);
            setAuthToken(token);

            login(
              token,
              data.data.user.name,
              data.data.user.email,
              data.data.user.image,
              data.data.user.name,
              true // showToast
            );
            
            sessionStorage.removeItem("google_login_in_progress");
            socialLoginAttempted.current = true;
          } else {
            console.error("Social login failed:", data);
            socialLoginAttempted.current = true;
            toast.error(data?.message || t('login_error') || "حدث خطأ أثناء تسجيل الدخول");
          }
        } catch (err) {
          console.error("Social login error:", err);
          socialLoginAttempted.current = true;
          toast.error(t('server_error') || "فشل الاتصال بالخادم");
        } finally {
          socialLoginInProgress.current = false;
        }
      };

      syncSocialLogin();
    }
  }, [session, status, authToken, language, isLoggingOut]);

  /* ---------------------- LOGOUT FUNCTION ---------------------- */
 /* ---------------------- LOGOUT FUNCTION ---------------------- */
const logout = async () => {
  try {
    setIsLoggingOut(true);
    
    // منع أي عمليات خلفية
    socialLoginAttempted.current = false;
    socialLoginInProgress.current = false;

    console.log("🚀 Starting main logout process...");

    /* -------------------- 1️⃣ CALL API LOGOUT FIRST -------------------- */
    const localToken = localStorage.getItem("auth_token");
    
    if (localToken) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log("📡 Calling API logout...");
        
        const response = await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Language": "ar",
            Authorization: `Bearer ${localToken}`,
          },
        });

        if (response.ok) {
          console.log("✅ API logout successful");
        } else {
          console.log("⚠️ API logout failed with status:", response.status);
        }
      } catch (apiError) {
        console.error("❌ API logout error:", apiError);
        // نستمر في عملية logout حتى لو فشل API
      }
    }

    /* -------------------- 2️⃣ THEN CALL FIREBASE LOGOUT -------------------- */
    if (firebaseLogoutRef.current) {
      console.log("🔥 Calling Firebase logout...");
      try {
        await firebaseLogoutRef.current();
        console.log("✅ Firebase logout completed");
      } catch (firebaseError) {
        console.error("❌ Firebase logout error:", firebaseError);
      }
    }

    /* -------------------- 3️⃣ CLEAR ALL STORAGE -------------------- */
    console.log("🧹 Clearing all storage...");
    
    localStorage.clear();
    sessionStorage.clear();
    
    // مسح الكوكيز
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log("✅ Storage cleared");

    /* -------------------- 4️⃣ RESET ALL STATE -------------------- */
    setAuthToken(null);
    setUserName(null);
    setUserEmail(null);
    setUserImage(null);
    setFullName(null);
    setFavoriteProducts([]);

    /* -------------------- 5️⃣ REDIRECT -------------------- */
    toast.success("تم تسجيل الخروج بنجاح");
    
    // استخدام window.location.href مع force reload
    setTimeout(() => {
      window.location.href = "/";
    }, 100);

  } catch (err) {
    console.error("❌ Logout error:", err);
    toast.error("حدث خطأ أثناء تسجيل الخروج");
    setIsLoggingOut(false);
  }
};

  /* ---------------------- FAVORITES ---------------------- */
  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setFavoriteProductsLoading(true);

      if (!authToken || isLoggingOut) {
        setFavoriteProducts([]);
        localStorage.removeItem("favorites");
        setFavoriteProductsLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/favorites`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "Accept-Language": language,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            setAuthToken(null);
            localStorage.removeItem("auth_token");
            setFavoriteProducts([]);
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const dataJson = await res.json();
        const list = Array.isArray(dataJson?.data) ? dataJson.data : [];

        const favoritesWithFlag: ProductI[] = list
          .filter((fav: any) => fav?.product && fav.product.id)
          .map((fav: any) => ({
            ...fav.product,
            is_favorite: true,
          }));

        const ids = list
          .map((fav: any) => fav?.product?.id)
          .filter(Boolean);

        if (!cancelled) {
          setFavoriteProducts(favoritesWithFlag);
          localStorage.setItem("favorites", JSON.stringify(ids));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        if (!cancelled) {
          setFavoriteProducts([]);
          localStorage.removeItem("favorites");
        }
      } finally {
        if (!cancelled) setFavoriteProductsLoading(false);
      }
    };

    fetchFavorites();

    return () => {
      cancelled = true;
    };
  }, [authToken, language, isLoggingOut]);

  const login = (
    token: string,
    name: string,
    email?: string,
    image?: string,
    fullNameParam?: string,
    showToast: boolean = false
  ) => {
    console.log("Login called with token:", token ? "exists" : "null");
    
    setAuthToken(token);
    setUserName(name);
    setUserEmail(email || null);
    setUserImage(image || "");
    setFullName(fullNameParam || name);

    localStorage.setItem("auth_token", token);
    localStorage.setItem("userName", name);
    if (email) localStorage.setItem("userEmail", email);
    if (image) localStorage.setItem("userImage", image);
    localStorage.setItem("fullName", fullNameParam || name);
    
    if (showToast) {
      toast.success(t('login_success') || "تم تسجيل الدخول بنجاح");
    }
  };

  const updateUserImage = (imageUrl: string) => {
    setUserImage(imageUrl);
    localStorage.setItem("userImage", imageUrl);
    
    const session = localStorage.getItem("userSession");
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.user) {
          sessionData.user.image = imageUrl;
          localStorage.setItem("userSession", JSON.stringify(sessionData));
        }
      } catch (error) {
        console.error("Error updating session:", error);
      }
    }
  };

  const setAuthFromApi = (data: {
    token: string;
    name: string;
    email?: string;
    image?: string;
    fullName?: string;
    message?: string;
  }, showToast: boolean = true) => {
    login(data.token, data.name, data.email, data.image, data.fullName, showToast);
    
    if (showToast) {
      toast.success(data.message || t('login_success') || "تم تسجيل الدخول بنجاح");
    }
  };

  const favoriteIdsSet = useMemo(() => {
    return new Set((favoriteProducts ?? []).map((p) => p.id));
  }, [favoriteProducts]);

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userName,
        userEmail,
        userImage,
        fullName,
        login,
        logout,
        updateUserImage,
        setAuthFromApi,
        favoriteProducts,
        favoriteProductsLoading,
        setFavoriteProducts,
        favoriteIdsSet,
        isLoading: status === "loading",
        isAuthenticated: !!authToken,
        isLoggingOut,
        registerFirebaseLogout, // ✅ تسجيل الدالة
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): any => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};