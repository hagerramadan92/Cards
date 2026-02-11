"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

import { fetchHomeData, fetchApi } from "@/lib/api";
import { useLanguage } from "@/src/context/LanguageContext";

import { CategoryI } from "@/Types/CategoriesI";
import { ProductI } from "@/Types/ProductsI";
import { SubCategoriesI } from "@/Types/SubCategoriesI";
import { BannerI } from "@/Types/BannerI";
import { SocialMediaI } from "@/Types/SocialMediaI";

interface HomeData {
  categories: CategoryI[];
  products: ProductI[];
  sub_categories: SubCategoriesI[];
  sliders: BannerI[];
  sub_categories_pagination: any;
  appear_in_home_categories: any;
}

interface AppContextType {
  homeData: HomeData | null;
  parentCategories: CategoryI[];
  childCategories: CategoryI[];
  socialMedia: SocialMediaI[];
  appear_in_home_categories: any;
  paymentMethods: any;
  loading: boolean;
  error: string | null;
  loadingHome: boolean;
  loadingCategories: boolean;
  refreshAppData: (language?: string) => Promise<void>;
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
  currentLanguage: 'ar',
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { language: currentLanguage } = useLanguage();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loadingHome, setLoadingHome] = useState<boolean>(true);
  const [parentCategories, setParentCategories] = useState<CategoryI[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [childCategories, setChildCategories] = useState<CategoryI[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>([]);
  const [appear_in_home_categories, setAppearInHomeCategories] = useState<any>([]);
  const [paymentMethods, setPaymentMethods] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // دالة لتحديث جميع البيانات بناءً على اللغة
const refreshAppData = useCallback(async (language?: string) => {
  const lang = language || currentLanguage;
  
  try {
    const isInitialLoad = !homeData || parentCategories.length === 0;
    if (isInitialLoad) {
      setLoading(true);
      setLoadingHome(true);
      setLoadingCategories(true);
    }
    setError(null);

    console.log(`Refreshing app data with language: ${lang}`);

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
    
    // ✅ تحديث حالة التحميل بعد تحميل البيانات الحرجة
    setLoadingHome(false);
    setLoadingCategories(false);
    if (isInitialLoad) setLoading(false);
    
    // المجموعة 2: البيانات غير الحرجة (يمكن تأجيلها)
    setTimeout(async () => {
      try {
        await Promise.allSettled([
          fetchApi("categories?type=child", {}, lang).then(res => {
            setChildCategories(Array.isArray(res) ? res : []);
            return res;
          }),
          
          fetchApi("social-media", {}, lang).then(res => {
            setSocialMedia(Array.isArray(res) ? res : []);
            return res;
          }),
          
          fetchApi("payment-methods?is_payment=true", {}, lang).then(res => {
            setPaymentMethods(Array.isArray(res) ? res : []);
            return res;
          })
        ]);
      } catch (err) {
        console.warn("Non-critical data failed:", err);
      }
    }, 500); // تأخير 500ms للبيانات غير الحرجة

  } catch (err: any) {
    if (err === "Language changed" || err?.message === "Language changed") return;
    
    setError(err.message || "فشل تحميل البيانات");
    console.error("Error in refreshAppData:", err);
  } finally {
    // تم نقل setLoading إلى بعد تحميل البيانات الحرجة
  }
}, [currentLanguage]);

  // تحديث البيانات عند تغيير اللغة مباشرة من context أو عبر الحدث
  useEffect(() => {
    // 1. التحديث عند تغيير حالة اللغة في السياق
    refreshAppData();

    // 2. التحديث عند استلام حدث تغيير اللغة (يتيح التحديث حتى لو تم اختيار نفس اللغة)
    const handleLanguageChange = (e: any) => {
      const newLang = e.detail?.language;
      if (newLang) {
        console.log(`Event languageChanged: Refreshing data for ${newLang}`);
        refreshAppData(newLang);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("languageChanged", handleLanguageChange as any);
      return () => {
        window.removeEventListener("languageChanged", handleLanguageChange as any);
      };
    }
  }, [currentLanguage, refreshAppData]);

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
        currentLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);