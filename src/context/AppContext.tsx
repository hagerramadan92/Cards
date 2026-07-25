"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

import { fetchHomeData, fetchApi } from "@/lib/api";
import { useLanguage } from "@/src/context/LanguageContext";

import { CategoryI } from "@/Types/CategoriesI";
import { SubCategoriesI } from "@/Types/SubCategoriesI";
import { BannerI } from "@/Types/BannerI";
import { SocialMediaI } from "@/Types/SocialMediaI";

export interface HomeData {
  sub_categories: SubCategoriesI[];
  sliders: BannerI[];
  sub_categories_pagination: unknown;
  appear_in_home_categories: SubCategoriesI[];
}

interface AppContextType {
  homeData: HomeData | null;
  parentCategories: CategoryI[];
  childCategories: CategoryI[];
  socialMedia: SocialMediaI[];
  appear_in_home_categories: SubCategoriesI[];
  paymentMethods: unknown[];
  loading: boolean;
  error: string | null;
  loadingHome: boolean;
  loadingCategories: boolean;
  refreshAppData: (language?: string) => Promise<void>;
  hydrateInitialData: (
    homeData: HomeData | null,
    parentCategories: CategoryI[],
  ) => void;
  currentLanguage: string;
}

const AppContext = createContext<AppContextType>({
  homeData: null,
  parentCategories: [],
  childCategories: [],
  socialMedia: [],
  appear_in_home_categories: [],
  paymentMethods: [],
  loading: true,
  error: null,
  loadingHome: true,
  loadingCategories: true,
  refreshAppData: async () => {},
  hydrateInitialData: () => {},
  currentLanguage: 'ar',
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { language: currentLanguage } = useLanguage();
  const pathname = usePathname();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loadingHome, setLoadingHome] = useState<boolean>(true);
  const [parentCategories, setParentCategories] = useState<CategoryI[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [childCategories, setChildCategories] = useState<CategoryI[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>([]);
  const [appear_in_home_categories, setAppearInHomeCategories] = useState<
    SubCategoriesI[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasCriticalDataRef = useRef(false);
  const lastLanguageEventRef = useRef<string | null>(null);

  const refreshSupplementaryData = useCallback(async (language: string) => {
    try {
      await Promise.allSettled([
        fetchApi("categories?type=child", {}, language).then(res => {
          setChildCategories(Array.isArray(res) ? res : []);
          return res;
        }),

        fetchApi("social-media", {}, language).then(res => {
          setSocialMedia(Array.isArray(res) ? res : []);
          return res;
        }),

        fetchApi("payment-methods?is_payment=true", {}, language).then(res => {
          setPaymentMethods(Array.isArray(res) ? res : []);
          return res;
        })
      ]);
    } catch (err) {
      console.warn("Non-critical data failed:", err);
    }
  }, []);

  // دالة لتحديث جميع البيانات بناءً على اللغة
const refreshAppData = useCallback(async (language?: string) => {
  const lang = language || currentLanguage;
  
  try {
    const isInitialLoad = !hasCriticalDataRef.current;
    if (isInitialLoad) {
      setLoading(true);
      setLoadingHome(true);
      setLoadingCategories(true);
    }
    setError(null);



    // 🔥 **الحل: تقسيم API calls إلى مجموعتين**
    
    // المجموعة 1: البيانات الحرجة أولاً (للصفحة الرئيسية)
    const criticalPromises = Promise.allSettled([
      fetchHomeData(lang).then(res => {
        setHomeData(res);
        setAppearInHomeCategories(res?.appear_in_home_categories || []);
        return res;
      }),
      
      fetchApi("categories?type=parent", {}, lang).then(res => {
        setParentCategories(Array.isArray(res) ? res : []);
        return res;
      }),
    ]);

    // معالجة النتائج الحرجة أولاً
    await criticalPromises;
    hasCriticalDataRef.current = true;
    
    // ✅ تحديث حالة التحميل بعد تحميل البيانات الحرجة
    setLoadingHome(false);
    setLoadingCategories(false);
    if (isInitialLoad) setLoading(false);
    
    // المجموعة 2: البيانات غير الحرجة (يمكن تأجيلها)
    setTimeout(() => {
      void refreshSupplementaryData(lang);
    }, 500); // تأخير 500ms للبيانات غير الحرجة

  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "";

    if (errorMessage === "Language changed") return;

    setError(errorMessage || "فشل تحميل البيانات");
    console.error("Error in refreshAppData:", err);
  } finally {
    // تم نقل setLoading إلى بعد تحميل البيانات الحرجة
  }
}, [currentLanguage, refreshSupplementaryData]);

  const hydrateInitialData = useCallback(
    (initialHomeData: HomeData | null, initialParentCategories: CategoryI[]) => {
      setHomeData(initialHomeData);
      setParentCategories(initialParentCategories);
      setAppearInHomeCategories(
        initialHomeData?.appear_in_home_categories || [],
      );
      setLoading(false);
      setLoadingHome(false);
      setLoadingCategories(false);
      setError(null);
      hasCriticalDataRef.current = Boolean(
        initialHomeData || initialParentCategories.length,
      );
    },
    [],
  );

  // تحديث البيانات عند تغيير اللغة مباشرة من context أو عبر الحدث
  useEffect(() => {
    if (pathname === "/") {
      const supplementaryTimer = window.setTimeout(() => {
        void refreshSupplementaryData(currentLanguage);
      }, 500);

      return () => window.clearTimeout(supplementaryTimer);
    }

    if (lastLanguageEventRef.current === currentLanguage) {
      lastLanguageEventRef.current = null;
      return;
    }

    void refreshAppData();
  }, [
    currentLanguage,
    pathname,
    refreshAppData,
    refreshSupplementaryData,
  ]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      if (pathname === "/" || !(event instanceof CustomEvent)) return;

      const detail = event.detail as { language?: unknown } | null;
      if (typeof detail?.language === "string") {
        lastLanguageEventRef.current = detail.language;
        void refreshAppData(detail.language);
      }
    };

    window.addEventListener("languageChanged", handleLanguageChange);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange);
    };
  }, [pathname, refreshAppData]);

  useEffect(() => {
    const handleServerRefreshFailure = (event: Event) => {
      if (pathname !== "/" || !(event instanceof CustomEvent)) return;

      const detail = event.detail as { language?: unknown } | null;
      if (typeof detail?.language === "string") {
        void refreshAppData(detail.language);
      }
    };

    window.addEventListener(
      "languageServerRefreshFailed",
      handleServerRefreshFailure,
    );

    return () => {
      window.removeEventListener(
        "languageServerRefreshFailed",
        handleServerRefreshFailure,
      );
    };
  }, [pathname, refreshAppData]);

  return (
    <AppContext.Provider
      value={{
        homeData,
        parentCategories,
        childCategories,
        socialMedia,
        paymentMethods,
        loading,
        error,
        loadingHome,
        loadingCategories,
        appear_in_home_categories,
        refreshAppData,
        hydrateInitialData,
        currentLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
