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
      // Only show full loading if we don't have data yet
      const isInitialLoad = !homeData || parentCategories.length === 0;
      if (isInitialLoad) {
        setLoading(true);
        setLoadingHome(true);
        setLoadingCategories(true);
      }
      setError(null);

      console.log(`Refreshing app data with language: ${lang} (Initial: ${isInitialLoad})`);

      // جلب جميع البيانات بالتوازي مع اللغة المحددة
      const [
        homeResult,
        parentResult,
        childResult,
        socialResult,
        paymentResult
      ] = await Promise.allSettled([
        // 1) Home Data
        fetchHomeData(lang).then(res => {
          setHomeData(res);
          setAppearInHomeCategories(res?.appear_in_home_categories || []);
          return res;
        }),
        
        // 2) Categories Parent
        fetchApi("categories?type=parent", {}, lang).then(res => {
          setParentCategories(Array.isArray(res) ? res : []);
          return res;
        }),
        
        // 3) Categories Child
        fetchApi("categories?type=child", {}, lang).then(res => {
          setChildCategories(Array.isArray(res) ? res : []);
          return res;
        }),
        
        // 4) Social Media
        fetchApi("social-media", {}, lang).then(res => {
          setSocialMedia(Array.isArray(res) ? res : []);
          return res;
        }),
        
        // 5) Payment Methods
        fetchApi("payment-methods?is_payment=true", {}, lang).then(res => {
          setPaymentMethods(Array.isArray(res) ? res : []);
          return res;
        })
      ]);

      // معالجة الأخطاء
      const errors: string[] = [];
      
      const checkResult = (result: PromiseSettledResult<any>, name: string) => {
        if (result.status === 'rejected') {
          // Ignore abort errors
          const isAbort = result.reason === "Language changed" || result.reason?.message === "Language changed";
          if (!isAbort) {
            console.error(`Error fetching ${name}:`, result.reason);
            errors.push(name);
          }
        }
      };

      checkResult(homeResult, 'Home data');
      checkResult(parentResult, 'Parent categories');
      checkResult(childResult, 'Child categories');
      checkResult(socialResult, 'Social media');
      checkResult(paymentResult, 'Payment methods');
      
      if (errors.length > 0) {
        setError(`Failed to load: ${errors.join(', ')}`);
      }

    } catch (err: any) {
      // Ignore top-level aborts
      if (err === "Language changed" || err?.message === "Language changed") return;
      
      setError(err.message || "فشل تحميل البيانات");
      console.error("Error in refreshAppData:", err);
    } finally {
      setLoading(false);
      setLoadingHome(false);
      setLoadingCategories(false);
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