"use client";

import { auth, googleProvider } from "@/lib/firebaseClient";
import { signInWithPopup } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "@/src/context/AuthContext";

export default function LoginWithGoogle() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { login: loginContext } = useAuth();

  const sendUserDataToBackend = async (user: any) => {
    const idToken = await user.getIdToken();

    const payload = {
      provider: "google",
      id_token: idToken,             
      provider_id: user.uid,         
      email: user.email,
      name: user.displayName,
      image: user.photoURL,
    };

		

    const res = await fetch(`${API_URL}/auth/social-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data?.status === false) {
      if (res.status === 409) {
        toast.error("الحساب مسجل بالفعل بطريقة أخرى (البريد الإلكتروني/كلمة المرور). رجاءً سجل الدخول بالطريقة المعتادة.");
        return;
      }
      toast.error(data?.message || "حدث خطأ غير متوقع");
      return;
    }

    // ✅ لو الباك بيرجع token + user (زي login العادي)
    const token = data?.data?.token;
    const backendUser = data?.data?.user;

    if (token) {
      loginContext(
        token,
        backendUser?.name || user.displayName,
        backendUser?.email || user.email,
        backendUser?.image || user.photoURL,
        backendUser?.name || user.displayName
      );
    }

    toast.success("تم تسجيل الدخول بنجاح!");
    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    if (!API_URL) {
      toast.error("NEXT_PUBLIC_API_URL غير موجود في env");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await sendUserDataToBackend(result.user);
    } catch (error: any) {
      console.error("Google login error:", error);

      // errors common
      if (error?.code === "auth/unauthorized-domain") {
        toast.error("خطأ: الدومين غير مصرح به في Firebase. يرجى إضافته في Authentication > Settings > Authorized Domains");
        console.error("Add this domain to Firebase Console: ", window.location.hostname);
      } else if (error?.code === "auth/popup-blocked") {
        toast.error("تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        toast.error("البريد الإلكتروني مستخدم بالفعل بحساب مختلف. يرجى تسجيل الدخول بالطريقة الأصلية.");
      } else {
        toast.error("فشل تسجيل الدخول بجوجل. " + (error?.message || ""));
      }
    } finally {
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
          <p className="font-bold text-slate-600">جاري تسجيل الدخول...</p>
        ) : (
          <>
            <p className="font-extrabold text-slate-800">Google</p>
            <Image src="/images/g.png" alt="Google" width={22} height={22} />
          </>
        )}
      </div>
    </button>
  );
}
