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
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("فشل تسجيل الدخول بجوجل");
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
