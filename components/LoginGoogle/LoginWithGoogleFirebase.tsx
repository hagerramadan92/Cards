"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";

export default function LoginWithGoogleFirebase() {
  const [loading, setLoading] = useState(false);
  const { setAuthFromApi, isLoggingOut } = useAuth(); // ✅ إضافة isLoggingOut
  const { language } = useLanguage();

  const handleGoogleSignIn = async () => {
    // ✅ لا تسمح بتسجيل الدخول أثناء logout
    if (isLoggingOut) {
      toast.error("جاري تسجيل الخروج، الرجاء الانتظار");
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const payload = {
        provider: "google",
        provider_id: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
      };

      console.log("Sending to social-login API:", payload);

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
      console.log("API Response:", data);

      if (response.ok && data.status && data.data?.token) {
        setAuthFromApi({
          token: data.data.token,
          name: data.data.user?.name || user.displayName || "مستخدم",
          email: data.data.user?.email || user.email || "",
          image: data.data.user?.image || user.photoURL || "",
          fullName: data.data.user?.name || user.displayName || "مستخدم"
        }, true);
        
        sessionStorage.removeItem("google_login_in_progress");
        window.location.href = "/";
      } else {
        console.error("Social login failed:", data);
        toast.error(data?.message || "فشل تسجيل الدخول");
      }
      
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      switch (error.code) {
        case "auth/popup-closed-by-user":
          toast.error("تم إغلاق نافذة التسجيل");
          break;
        case "auth/cancelled-popup-request":
          toast.error("تم إلغاء طلب التسجيل");
          break;
        default:
          toast.error("فشل تسجيل الدخول بجوجل");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading || isLoggingOut}
      className="w-full p-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:shadow transition disabled:opacity-60"
    >
      {loading ? (
        <span>جاري تسجيل الدخول...</span>
      ) : (
        <>
          <span>تسجيل الدخول بجوجل</span>
          <Image src="/images/g.png" alt="Google" width={22} height={22} />
        </>
      )}
    </button>
  );
}