"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { BiChevronDown, BiRefresh, BiGlobe } from "react-icons/bi";

const flagMap: Record<string, string> = {
  en: "🇺🇸",
  ar: "🇸🇦", 
  fr: "🇫🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  it: "🇮🇹",
  ru: "🇷🇺",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

export default function LanguageSelector() {
  const { 
    language, 
    setLanguage, 
    availableLanguages, 
    isLoadingLanguages,
    error,
    refreshLanguages,
    detectBrowserLanguage,
    updateAllRequestsLanguage
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [browserLang, setBrowserLang] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = availableLanguages.map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: flagMap[lang.code] || "🌐"
  }));

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBrowserLang(detectBrowserLanguage());
    }
  }, [detectBrowserLanguage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode: string) => {
    try {
      // تحديث اللغة في السياق (سيقوم بتحديث الـ headers تلقائياً)
      setLanguage(langCode);
      
      // إرسال طلب API لإخبار الخادم بتغيير اللغة
      await sendLanguageChangeRequest(langCode);
      
      setIsOpen(false);
      
      // إظهار رسالة نجاح
      showLanguageChangeToast(langCode);
      
    } catch (error) {
      console.error("Error changing language:", error);
      // يمكنك إضافة معالجة الأخطاء هنا
    }
  };

  // دالة لإرسال طلب تغيير اللغة إلى الخادم
  const sendLanguageChangeRequest = async (langCode: string) => {
    // هذا مثال لطلب API لتغيير إعدادات اللغة على الخادم
    // يمكنك تكييفه حسب احتياجاتك
    
    const languageChangeEndpoint = "/api/update-language-preference";
    
    try {
      const response = await fetch(languageChangeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": langCode,
        },
        body: JSON.stringify({
          language: langCode,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update language preference: ${response.status}`);
      }

      const data = await response.json();
   
      
      return data;
    } catch (error) {
      console.warn("Could not update server language preference, using client-side only");
    
    }
  };

  // دالة لعرض إشعار تغيير اللغة
  const showLanguageChangeToast = (langCode: string) => {
    // يمكنك استخدام أي مكتبة toast تفضلها
    // هنا مثال باستخدام alert بسيط
    if (typeof window !== "undefined") {
      const langName = languages.find(l => l.code === langCode)?.name || langCode;
      

    }
  };

  const handleRefreshLanguages = async () => {
    await refreshLanguages();
    setIsOpen(false);
  };

  // Rule of Hooks: Early returns must come AFTER all hook calls
  if (!mounted) {
    // Return a consistent placeholder that matches the server-side default (usually Arabic "ar")
    // This prevents the "Hydration failed" error by ensuring initial client render matches server HTML.
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 opacity-50"
          aria-label="Select language"
          disabled
        >
          <span className="text-sm">🇸🇦</span>
          <span className="hidden sm:inline text-sm font-medium text-gray-700">
            العربية
          </span>
          <BiChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  if (isLoadingLanguages && availableLanguages.length <= 3) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 animate-pulse"
          aria-label="Loading languages"
          disabled
        >
          <BiGlobe className="w-4 h-4 text-gray-400" />
          <span className="hidden sm:inline text-sm font-medium text-gray-400">
            Loading...
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        aria-label="Select language"
        aria-expanded={isOpen}
        disabled={languages.length === 0}
      >
        <span className="text-sm">{currentLang?.flag || "🌐"}</span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {currentLang?.name?.substring(0, 10) || language.toUpperCase()}
        </span>
        <BiChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full end-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto"
          >
            
            {/* قائمة اللغات */}
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    language === lang.code 
                      ? "bg-blue-50 text-pro font-semibold border-s-2 border-blue-900" 
                      : "text-gray-700"
                  }`}
                  title={`Change language to ${lang.name} (${lang.code})`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{lang.name}</div>
                  </div>
                  {language === lang.code && (
                    <span className="text-blue-900 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
            
         
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}