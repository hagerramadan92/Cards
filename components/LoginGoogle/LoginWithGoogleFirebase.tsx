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
  const { setAuthFromApi, isLoggingOut, fetchUserProfile } = useAuth();
  const { language } = useLanguage();

  const handleGoogleSignIn = async () => {
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
      
      // إرسال الصورة مع البيانات للباك اند
      const payload = {
        provider: "google",
        provider_id: user.uid,
        email: user.email || "",
        name: user.displayName || "User",
        image: user.photoURL || "", // إضافة الصورة
      };

  

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        console.error("❌ NEXT_PUBLIC_API_URL is not defined!");
        toast.error("خطأ في إعدادات الخادم");
        return;
      }
      
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
        // استخدم البيانات من الباك اند
        setAuthFromApi({
          token: data.data.token,
          name: data.data.user?.name || user.displayName || "مستخدم",
          email: data.data.user?.email || user.email || "",
          image: data.data.user?.image || user.photoURL || "",
          fullName: data.data.user?.name || user.displayName || "مستخدم"
        }, true);
        
        sessionStorage.removeItem("google_login_in_progress");
        
        // جلب البروفايل بعد تسجيل الدخول مباشرة
        await fetchUserProfile();
        
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
        case "auth/unauthorized-domain":
          toast.error("هذا النطاق غير مصرح به في Firebase");
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