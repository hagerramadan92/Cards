"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaHeart,
  FaQuestionCircle,
} from "react-icons/fa";
import {
  FaArrowRightFromBracket,
  FaClipboardCheck,
  FaUser,
} from "react-icons/fa6";
import { useAuth } from "@/src/context/AuthContext";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/src/context/LanguageContext";
import { useFirebaseAuth } from "@/src/context/FirebaseAuthContext";

export default function DropdownUser() {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { fullName, userImage, authToken, fetchUserProfile } = useAuth();
  const { t } = useLanguage();
  
  const { user: firebaseUser } = useFirebaseAuth();

  // ✅ قائمة الصور المحظورة (المواقع التي تمنع الـ hotlinking)
  const blockedDomains = [
    'static.vecteezy.com',
    'vecteezy.com',
    'placeholder.com',
    'via.placeholder.com',
    'placehold.co',
    'picsum.photos',
    'dummyimage.com'
  ];

  // ✅ التحقق إذا كانت الصورة من domain محظور
  const isBlockedImage = (url: string) => {
    return blockedDomains.some(domain => url.includes(domain));
  };

  // ✅ الحصول على الحرف الأول من الاسم
  const getInitial = () => {
    if (displayName && displayName !== "مستخدم" && displayName !== "User") {
      return displayName.charAt(0).toUpperCase();
    }
    return "U";
  };

  // تحديد الصورة المعروضة (الأولوية للصورة من الباك اند)
  const displayImage = useMemo(() => {
    console.log("🖼️ userImage from backend:", userImage);
    
    // 1. الأولوية الأولى: الصورة من الباك اند (userImage)
    if (userImage && 
        userImage !== "null" && 
        userImage !== "" && 
        userImage !== undefined &&
        !isBlockedImage(userImage)) { // تجاهل الصور المحظورة
      return userImage;
    }
    
    // 2. إذا كان المستخدم مسجل دخول ولكن لا توجد صورة من الباك اند، استخدم صورة Firebase
    if (firebaseUser?.photoURL && !isBlockedImage(firebaseUser.photoURL)) {
      return firebaseUser.photoURL;
    }
    
    // 3. لا صورة - هنستخدم الحرف الأول
    return null;
  }, [userImage, firebaseUser]);

  // تحديد الاسم المعروض
  const displayName = useMemo(() => {
    if (fullName && fullName !== "null" && fullName !== "") {
      return fullName;
    }
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName;
    }
    return t("user") || "مستخدم";
  }, [fullName, firebaseUser, t]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // إعادة تعيين حالة الخطأ عندما تتغير الصورة
  useEffect(() => {
    setImageError(false);
  }, [displayImage]);

  // تحديث البروفايل كل فترة (كل 5 دقائق)
  useEffect(() => {
    if (authToken && !imageError) {
      const interval = setInterval(() => {
        fetchUserProfile();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [authToken, imageError, fetchUserProfile]);

  const handleLinkClick = () => setOpen(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  const items = [
    { href: "/myAccount", label: t("myAccount"), icon: <FaUser size={18} /> },
    { href: "/myAccount/orders", label: t("orders"), icon: <FaClipboardCheck size={18} /> },
    { href: "/myAccount/favorites", label: t("favorites"), icon: <FaHeart size={16} /> },
    { href: "/myAccount/help", label: t("help"), icon: <FaQuestionCircle size={18} /> },
  ];

  return (
    <div className="relative max-md:mt-[3px]" ref={menuRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center md:gap-3 rounded-full border border-slate-200 bg-white/80 md:backdrop-blur md:px-3 md:py-2 md:hover:shadow-md md:hover:bg-white transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 opacity-0 group-hover:opacity-100 transition" />
          <div className="relative w-[30px] h-[30px] md:w-[35px] md:h-[35px] flex items-center justify-center">
            {imageError || !displayImage ? (
              // ✅ عرض الحرف الأول إذا فشلت الصورة أو لا توجد صورة
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                {getInitial()}
              </div>
            ) : (
              <Image
                key={displayImage}
                src={displayImage}
                alt={displayName}
                fill
                sizes="(max-width: 768px) 30px, 35px"
                className="relative rounded-full object-cover"
                onError={(e) => {
                  console.log("❌ Image failed to load:", displayImage);
                  setImageError(true);
                  // منع المحاولات المتكررة
                  e.currentTarget.src = "";
                }}
              />
            )}
          </div>
          <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div> */}

        <div className="flex flex-col items-start leading-tight">
          <span className="text-[14px] text-slate-500 font-semibold hidden md:block">{t("welcome2")}</span>
        </div>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500 max-md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute end-0 mt-3 w-52 md:w-72 z-50"
          >
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {/* header */}
              <div className="p-2 md:p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  {/* <div className="h-[50px] overflow-hidden w-[50px] rounded-full">
                    {imageError || !displayImage ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {getInitial()}
                      </div>
                    ) : (
                      <Image
                        src={displayImage}
                        alt={displayName}
                        width={54}
                        height={44}
                        className="object-cover w-full h-full"
                        onError={() => {
                          console.log("❌ Dropdown image failed");
                          setImageError(true);
                        }}
                      />
                    )}
                  </div> */}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold truncate">
                      {t("welcome")}
                    </p>
                  </div>
                </div>
              </div>

              {/* القائمة */}
              <div className="p-2">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={handleLinkClick}
                    className="group flex items-center justify-between gap-2 md:gap-3 rounded-2xl px-3 py-2.5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 group-hover:scale-[1.02] transition">
                        {it.icon}
                      </span>
                      <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{it.label}</span>
                    </div>
                  </Link>
                ))}

                <div className="my-2 h-px bg-slate-200" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-rose-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-2xl border border-rose-200 bg-white flex items-center justify-center text-rose-600">
                      <FaArrowRightFromBracket size={18} />
                    </span>
                    <span className="text-sm font-extrabold text-rose-700">{t("logout")}</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}