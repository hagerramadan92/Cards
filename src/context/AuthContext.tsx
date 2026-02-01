"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const [favoriteProductsLoading, setFavoriteProductsLoading] =
    useState<boolean>(false);

  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated: () => {
      // Silently handle unauthenticated state
    },
  });

  /* ---------------------- LOAD LOCAL STORAGE + NEXTAUTH USER ---------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("auth_token");
    const storedName = localStorage.getItem("userName");
    const storedEmail = localStorage.getItem("userEmail");
    const storedImage = localStorage.getItem("userImage");
    const storedFullName = localStorage.getItem("fullName");

    // Set from localStorage (only if different to avoid waterfall renders)
    if (storedToken && storedToken !== authToken) setAuthToken(storedToken);
    if (storedName && storedName !== userName) setUserName(storedName);
    if (storedEmail && storedEmail !== userEmail) setUserEmail(storedEmail);
    if (storedImage && storedImage !== userImage) setUserImage(storedImage);
    if (storedFullName && storedFullName !== fullName) setFullName(storedFullName);

    // Update from NextAuth session
    if (status === "authenticated" && session?.user) {
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
  }, [session, status]); // intentionally not depending on userName/authToken to avoid cascades

  /* ---------------------- SOCIAL LOGIN BACKEND SYNC ---------------------- */
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const user = session.user as any;

    // We need provider_id to login with backend
    if (user.provider_id && !authToken) {
      const syncSocialLogin = async () => {
        const payload = {
          provider: (user.provider || "google").toLowerCase(), // ensure lowercase
          provider_id: String(user.provider_id), // ensure string
          email: user.email || "",
          name: user.name || "User",
        };

        console.log("Attempting social login...", { url: `${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, payload });

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Language": language || "ar",
            },
            body: JSON.stringify(payload),
          });

          const rawText = await res.text();
          console.log("Social login raw response:", res.status, rawText);

          // Check if response is not 200 (success)
          if (!res.ok || res.status !== 200) {
            console.error("Social login API returned non-200 status:", res.status);
            
            let errorMessage = t('login_error') || "حدث خطأ أثناء تسجيل الدخول";
            
            // Try to parse error message from response
            if (rawText) {
              try {
                const errorData = JSON.parse(rawText);
                errorMessage = errorData?.message || errorMessage;
              } catch (e) {
                // If parsing fails, use default message
              }
            }
            
            toast.error(errorMessage);
            
            // Sign out from NextAuth session if API failed
            nextAuthSignOut({ callbackUrl: "/login" });
            return;
          }

          if (!rawText) {
             console.error("Empty response from social login API");
             toast.error(t('login_error') || "حدث خطأ أثناء تسجيل الدخول");
             nextAuthSignOut({ callbackUrl: "/login" });
             return;
          }

          let data;
          try {
             data = JSON.parse(rawText);
          } catch (e) {
             console.error("Failed to parse social login JSON:", e);
             toast.error(t('login_error') || "حدث خطأ أثناء تسجيل الدخول");
             nextAuthSignOut({ callbackUrl: "/login" });
             return;
          }
          
          // Only save session if response is 200 and has valid token
          if (res.ok && res.status === 200 && data.status && data.data?.token) {
            const token = data.data.token;
            console.log("Social login success, token received:", token);
            
            // ✅ Explicitly save to localStorage and state
            localStorage.setItem("auth_token", token);
            setAuthToken(token);

            login(
              token,
              data.data.user.name,
              data.data.user.email,
              data.data.user.image,
              data.data.user.name
            );
            
            // Show success toast
            toast.success(data.message || t('login_success') || "تم تسجيل الدخول بنجاح");
          } else {
             console.error("Social login API returned error status or missing token:", data);
             const errorMessage = data?.message || t('login_error') || "حدث خطأ أثناء تسجيل الدخول";
             toast.error(errorMessage);
             nextAuthSignOut({ callbackUrl: "/login" });
          }
        } catch (err) {
          console.error("Social login network error:", err);
          toast.error(t('server_error') || "فشل الاتصال بالخادم");
          nextAuthSignOut({ callbackUrl: "/login" });
        }
      };

      syncSocialLogin();
    }
  }, [session, status, authToken, language]);

  /* ---------------------- FETCH FAVORITES (MERGED: PRODUCTS + IDS) ---------------------- */

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setFavoriteProductsLoading(true);

      if (!authToken) {
        setFavoriteProducts([]);
        localStorage.removeItem("favorites");
        setFavoriteProductsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
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

        // Products with is_favorite flag
        const favoritesWithFlag: ProductI[] = list
          .filter((fav: any) => fav?.product && fav.product.id)
          .map((fav: any) => ({
            ...fav.product,
            is_favorite: true,
          }));

        // IDs to localStorage (same request)
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
  }, [authToken]);

  /* ------------------------------ LOGIN ------------------------------ */
  const login = (
    token: string,
    name: string,
    email?: string,
    image?: string,
    fullNameParam?: string,
    showToast: boolean = false
  ) => {
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
    
    // Show success toast if requested
    if (showToast) {
      toast.success(t('login_success') || "تم تسجيل الدخول بنجاح");
    }
  };

  /* ------------------------------ API LOGIN ------------------------------ */
  const setAuthFromApi = (data: {
    token: string;
    name: string;
    email?: string;
    image?: string;
    fullName?: string;
    message?: string;
  }, showToast: boolean = true) => {
    login(data.token, data.name, data.email, data.image, data.fullName);
    
    // Show success toast after login
    if (showToast) {
      toast.success(data.message || t('login_success') || "تم تسجيل الدخول بنجاح");
    }
  };

  /* ------------------------------ LOGOUT ------------------------------ */
  const logout = () => {
    setAuthToken(null);
    setUserName(null);
    setUserEmail(null);
    setUserImage(null);
    setFullName(null);

    localStorage.clear();
    nextAuthSignOut({ callbackUrl: "/login" });
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
        setAuthFromApi,
        favoriteProducts,
        favoriteProductsLoading,
        setFavoriteProducts,
        favoriteIdsSet,
        isLoading: status === "loading",
        isAuthenticated: !!authToken,
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
