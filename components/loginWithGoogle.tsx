"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginWithGoogle() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
    
      
      // حفظ حالة أن تسجيل الدخول بدأ
      sessionStorage.setItem("google_login_in_progress", "true");
      
      const result = await signIn("google", { 
        callbackUrl: "/",
        redirect: true
      });
      
  
      
      // إذا كان هناك خطأ
      if (result?.error) {
        console.error("Sign in error:", result.error);
        toast.error("فشل تسجيل الدخول: " + result.error);
        sessionStorage.removeItem("google_login_in_progress");
        setLoading(false);
      }
      
      // ملاحظة: في حالة النجاح، سيتم إعادة التوجيه تلقائياً
      // ولن يتم تنفيذ الكود بعد ذلك
      
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("فشل تسجيل الدخول بجوجل");
      sessionStorage.removeItem("google_login_in_progress");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="w-full"
      aria-label="log in with google"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      <div
        className={`p-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:shadow transition ${
          loading ? "opacity-60" : ""
        }`}
      >
        {loading ? (
          <p className="text-sm font-semibold text-slate-700">جاري تسجيل الدخول...</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700">جوجل</p>
            <Image src="/images/g.png" alt="Google" width={22} height={22} />
          </>
        )}
      </div>
    </button>
  );
}