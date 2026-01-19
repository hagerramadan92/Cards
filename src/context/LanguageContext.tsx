"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, TranslationKey } from "../translations";

type Language = string;
type Direction = "rtl" | "ltr";

export interface LanguageData {
  id: number;
  code: string;
  name: string;
}

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  availableLanguages: LanguageData[];
  isLoadingLanguages: boolean;
  error: string | null;
  refreshLanguages: () => Promise<void>;
  detectBrowserLanguage: () => string | null;
  getLanguageHeaders: () => HeadersInit;
  updateAllRequestsLanguage: (langCode: string) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGES_API_ENDPOINT = "https://flash-cardy.renix4tech.com/api/v1/languages";

// استخدام Set مع تحسين لإدارة الـ AbortController
const activeRequests = new Set<AbortController>();

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with server-side defaults to prevent hydration mismatches
  const [language, setLanguageState] = useState<Language>("ar");
  const [direction, setDirection] = useState<Direction>("rtl");
  const [mounted, setMounted] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageData[]>([
    { id: 1, code: "ar", name: "العربية" },
    { id: 2, code: "en", name: "English" },
    { id: 3, code: "fr", name: "Français" }
  ]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languageHeaders, setLanguageHeaders] = useState<HeadersInit>({});

  // Apply initial attributes once mounted
  useEffect(() => {
    setMounted(true);
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir || "rtl");
    document.documentElement.setAttribute("lang", language || "ar");
  }, []);

  // دالة للكشف عن لغة المتصفح
  const detectBrowserLanguage = (): string | null => {
    if (typeof window === "undefined") return null;
    
    const browserLang = navigator.language || 
                       (navigator as any).userLanguage || 
                       (navigator as any).browserLanguage;
    
    if (!browserLang) return null;
    
    const baseLang = browserLang.split('-')[0].toLowerCase();
    return baseLang;
  };

  // دالة للحصول على headers الحالية
  const getLanguageHeaders = (): HeadersInit => {
    // نستخدم localStorage كقيمة مرجعية للتأكد من الحصول على أحدث لغة حتى قبل تحديث React State
    const currentLang = (typeof window !== "undefined" ? localStorage.getItem("language") : null) || language;
    
    return {
      'Accept-Language': currentLang,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  };

  // دالة آمنة لإلغاء جميع الطلبات النشطة
  const abortAllRequests = () => {
    // إنشاء نسخة من الـ Set لتجنب التعديل أثناء التكرار
    const controllers = Array.from(activeRequests);
    
    controllers.forEach(controller => {
      try {
        if (!controller.signal.aborted) {
          controller.abort("Language changed");
        }
      } catch (err) {
        // تجاهل الأخطاء الناتجة عن إلغاء الـ controller
        console.debug("Error aborting controller:", err);
      }
    });
    
    // مسح الـ Set بعد إلغاء جميع الـ controllers
    activeRequests.clear();
  };

  // دالة لتحديث جميع الطلبات مع اللغة الجديدة
  const updateAllRequestsLanguage = (langCode: string) => {
    // إلغاء جميع الطلبات النشطة بأمان
    abortAllRequests();
    
    // تحديث headers للطلبات المستقبلية
    setLanguageHeaders({
      'Accept-Language': langCode,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
    
    // تحديث localStorage وإرسال storage event
    if (typeof window !== "undefined") {
      const oldLang = localStorage.getItem("language");
      localStorage.setItem("language", langCode);
      
      // إرسال storage event للتبويبات الأخرى
      const storageEvent = new StorageEvent("storage", {
        key: "language",
        newValue: langCode,
        oldValue: oldLang,
        storageArea: localStorage,
        url: window.location.href
      });
      
      window.dispatchEvent(storageEvent);
      
      // إرسال custom event للمكونات في نفس الصفحة
      const customEvent = new CustomEvent("languageChanged", { 
        detail: { 
          language: langCode,
          oldLanguage: oldLang,
          timestamp: new Date().toISOString()
        } 
      });
      
      window.dispatchEvent(customEvent);
    }
    
    // تحديث html attributes
    const dir = langCode === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir || "rtl");
    document.documentElement.setAttribute("lang", langCode || "ar");
    
    console.log(`Language updated to "${langCode}". Total active requests aborted. Ready to re-fetch.`);
  };

  // دالة fetch محسنة مع إدارة headers ولغة
  const fetchWithLanguage = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    
    try {
      // إضافة الـ controller إلى الـ Set
      activeRequests.add(controller);
      
      const mergedOptions: RequestInit = {
        ...options,
        headers: {
          ...getLanguageHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      };
      
      console.log(`Fetching ${url} with Accept-Language: ${language}`);
      
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error: any) {
      // إذا كان الخطأ بسبب الإلغاء، لا نرميه
      const isAbort = 
        (error instanceof Error && error.name === 'AbortError') || 
        error === "Language changed" || 
        error?.message === "Language changed" ||
        domExceptionIsAbort(error);
        
      if (isAbort) {
        console.log(`Request to ${url} was aborted (Language change triggered)`);
        return null;
      }
      throw error;
    } finally {
      // إزالة الـ controller من الـ Set بعد اكتمال الطلب
      activeRequests.delete(controller);
    }
  };

  // دالة جلب اللغات من API
  const fetchLanguages = async (): Promise<LanguageData[]> => {
    try {
      setIsLoadingLanguages(true);
      setError(null);
      
      console.log('Fetching languages with Accept-Language:', language);
      
      const response = await fetchWithLanguage(LANGUAGES_API_ENDPOINT);
      
      // إذا تم إلغاء الطلب
      if (!response) {
        return [];
      }
      
      const result = await response.json();
      console.log('Languages API Response:', result);
      
      if (result.status && Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      }
      
      throw new Error("Invalid API response format");
    } catch (error: any) {
      const isAbort = error === "Language changed" || error?.message === "Language changed" || domExceptionIsAbort(error);
      
      if (!isAbort) {
        console.error("Error fetching languages:", error);
      }
      
      return availableLanguages; // Return current ones on error
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  // دالة تحديد اللغة الافتراضية
  const determineDefaultLanguage = (languages: LanguageData[]): string => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("language");
      if (savedLang && languages.some(lang => lang.code === savedLang)) {
        return savedLang;
      }
    }
    
    const browserLang = detectBrowserLanguage();
    if (browserLang) {
      const exactMatch = languages.find(lang => lang.code === browserLang);
      if (exactMatch) return exactMatch.code;
      
      const partialMatch = languages.find(lang => 
        browserLang.startsWith(lang.code) || lang.code.startsWith(browserLang)
      );
      if (partialMatch) return partialMatch.code;
    }
    
    return languages.length > 0 ? languages[0].code : "ar";
  };

  // دالة تحديث اللغات
  const refreshLanguages = async () => {
    const languages = await fetchLanguages();
    if (languages && languages.length > 0) {
      setAvailableLanguages(languages);
    }
  };

  // تحميل البيانات الأولية
  useEffect(() => {
    const loadInitialData = async () => {
      setMounted(true);
      
      // Sync with localStorage on client-side mount
      if (typeof window !== "undefined") {
        const savedLang = localStorage.getItem("language");
        if (savedLang && savedLang !== "ar") {
          setLanguageState(savedLang);
          setDirection(savedLang === "en" ? "ltr" : "rtl");
          
          // Update html attributes
          const dir = savedLang === "ar" ? "rtl" : "ltr";
          document.documentElement.setAttribute("dir", dir || "rtl");
          document.documentElement.setAttribute("lang", savedLang || "ar");
        }
      }
      
      // جلب اللغات المتاحة
      await refreshLanguages();
    };

    loadInitialData();
  }, []);

  const setLanguage = (langCode: Language) => {
    if (!langCode) return;
    
    console.log(`Setting application language to: ${langCode}...`);
    
    // Always update and trigger, even if same language (as per user request: "every select make request")
    updateAllRequestsLanguage(langCode);
    setLanguageState(langCode);
    setDirection(langCode === "ar" ? "rtl" : "ltr");
  };

  // تنظيف عند unmount
  useEffect(() => {
    return () => {
      abortAllRequests();
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      direction, 
      setLanguage, 
      availableLanguages,
      isLoadingLanguages,
      error,
      refreshLanguages,
      detectBrowserLanguage,
      getLanguageHeaders,
      updateAllRequestsLanguage,
      t: (key: TranslationKey) => {
        const langData = translations[language as keyof typeof translations] || translations.ar;
        return langData[key as keyof typeof langData] || key;
      }
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// تصدير دالة fetch مخصصة للاستخدام في المكونات الأخرى
export const createFetchWithLanguage = () => {
  let currentLanguage = "ar";
  
  return {
    setLanguage: (lang: string) => {
      currentLanguage = lang;
    },
    fetch: async (url: string, options: RequestInit = {}) => {
      const headers = {
        'Accept-Language': currentLanguage,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      return fetch(url, {
        ...options,
        headers,
      });
    },
  };
};

// Helper function to check if a value is an AbortError DOMException
function domExceptionIsAbort(error: any): boolean {
  return (
    error && 
    typeof error === 'object' && 
    (error.name === 'AbortError' || error.code === 20)
  );
}

// تصدير دالة لإرسال storage event يدوياً
export const dispatchLanguageChangeEvent = (newLang: string, oldLang?: string) => {
  if (typeof window === "undefined") return;
  
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "language",
      newValue: newLang,
      oldValue: oldLang || localStorage.getItem("language"),
      storageArea: localStorage,
      url: window.location.href
    })
  );
  
  window.dispatchEvent(
    new CustomEvent("languageChanged", { 
      detail: { 
        language: newLang,
        oldLanguage: oldLang,
        timestamp: new Date().toISOString()
      } 
    })
  );
};