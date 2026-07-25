"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
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

export interface AppInitialData {
  homeData?: HomeData | null;
  parentCategories?: CategoryI[];
  childCategories?: CategoryI[];
  socialMedia?: SocialMediaI[];
  paymentMethods?: unknown[];
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

export const AppProvider = ({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: AppInitialData;
}) => {
  const { language: currentLanguage } = useLanguage();
  const pathname = usePathname();
  const [homeData, setHomeData] = useState<HomeData | null>(
    initialData?.homeData ?? null,
  );
  const [loadingHome, setLoadingHome] = useState<boolean>(
    initialData?.homeData === undefined,
  );
  const [parentCategories, setParentCategories] = useState<CategoryI[]>(
    initialData?.parentCategories ?? [],
  );
  const [loadingCategories, setLoadingCategories] = useState<boolean>(
    initialData?.parentCategories === undefined,
  );
  const [childCategories, setChildCategories] = useState<CategoryI[]>(
    initialData?.childCategories ?? [],
  );
  const [socialMedia, setSocialMedia] = useState<SocialMediaI[]>(
    initialData?.socialMedia ?? [],
  );
  const [paymentMethods, setPaymentMethods] = useState<unknown[]>(
    initialData?.paymentMethods ?? [],
  );
  const [loading, setLoading] = useState<boolean>(
    !initialData?.homeData && !initialData?.parentCategories?.length,
  );
  const [error, setError] = useState<string | null>(null);
  const hasCriticalDataRef = useRef(
    Boolean(initialData?.homeData || initialData?.parentCategories?.length),
  );
  const lastLanguageEventRef = useRef<string | null>(null);
  const criticalRequestIdRef = useRef(0);
  const criticalRequestLanguageRef = useRef<string | null>(null);
  const supplementaryRequestIdRef = useRef(0);
  const supplementaryIdleIdRef = useRef<number | null>(null);
  const supplementaryTimerIdRef = useRef<number | null>(null);

  const refreshSupplementaryData = useCallback(async (language: string) => {
    const requestId = ++supplementaryRequestIdRef.current;

    try {
      const [childrenResult, socialResult, paymentResult] =
        await Promise.allSettled([
          fetchApi("categories?type=child", {}, language) as Promise<unknown>,
          fetchApi("social-media", {}, language) as Promise<unknown>,
          fetchApi(
            "payment-methods?is_payment=true",
            {},
            language,
          ) as Promise<unknown>,
      ]);

      if (requestId !== supplementaryRequestIdRef.current) return;

      if (childrenResult.status === "fulfilled") {
        setChildCategories(
          Array.isArray(childrenResult.value) ? childrenResult.value : [],
        );
      }
      if (socialResult.status === "fulfilled") {
        setSocialMedia(
          Array.isArray(socialResult.value) ? socialResult.value : [],
        );
      }
      if (paymentResult.status === "fulfilled") {
        setPaymentMethods(
          Array.isArray(paymentResult.value) ? paymentResult.value : [],
        );
      }
    } catch (err) {
      console.warn("Non-critical data failed:", err);
    }
  }, []);

  const scheduleSupplementaryData = useCallback(
    (language: string) => {
      if (supplementaryIdleIdRef.current !== null) {
        window.cancelIdleCallback(supplementaryIdleIdRef.current);
        supplementaryIdleIdRef.current = null;
      }
      if (supplementaryTimerIdRef.current !== null) {
        window.clearTimeout(supplementaryTimerIdRef.current);
        supplementaryTimerIdRef.current = null;
      }

      const run = () => {
        void refreshSupplementaryData(language);
      };

      if (typeof window.requestIdleCallback === "function") {
        supplementaryIdleIdRef.current = window.requestIdleCallback(run, {
          timeout: 2000,
        });
      } else {
        supplementaryTimerIdRef.current = window.setTimeout(run, 0);
      }
    },
    [refreshSupplementaryData],
  );

  const refreshAppData = useCallback(async (language?: string) => {
    const lang = language || currentLanguage;
    if (criticalRequestLanguageRef.current === lang) return;

    const requestId = ++criticalRequestIdRef.current;
    criticalRequestLanguageRef.current = lang;

    try {
      const isInitialLoad = !hasCriticalDataRef.current;
      if (isInitialLoad) {
        setLoading(true);
        setLoadingHome(true);
        setLoadingCategories(true);
      }
      setError(null);

      const [homeResult, categoriesResult] = await Promise.allSettled([
        fetchHomeData(lang) as Promise<unknown>,
        fetchApi("categories?type=parent", {}, lang) as Promise<unknown>,
      ]);

      if (requestId !== criticalRequestIdRef.current) return;

      if (
        homeResult.status === "fulfilled" &&
        typeof homeResult.value === "object" &&
        homeResult.value !== null
      ) {
        const nextHomeData = homeResult.value as HomeData;
        setHomeData(nextHomeData);
      }
      if (categoriesResult.status === "fulfilled") {
        setParentCategories(
          Array.isArray(categoriesResult.value)
            ? categoriesResult.value
            : [],
        );
      }

      hasCriticalDataRef.current = true;
      setLoadingHome(false);
      setLoadingCategories(false);
      setLoading(false);
      scheduleSupplementaryData(lang);
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
      if (requestId === criticalRequestIdRef.current) {
        criticalRequestLanguageRef.current = null;
      }
    }
  }, [currentLanguage, scheduleSupplementaryData]);

  const hydrateInitialData = useCallback(
    (initialHomeData: HomeData | null, initialParentCategories: CategoryI[]) => {
      setHomeData(initialHomeData);
      setParentCategories(initialParentCategories);
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
      scheduleSupplementaryData(currentLanguage);
      return;
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
    scheduleSupplementaryData,
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

  useEffect(() => {
    return () => {
      criticalRequestIdRef.current += 1;
      supplementaryRequestIdRef.current += 1;
      if (supplementaryIdleIdRef.current !== null) {
        window.cancelIdleCallback(supplementaryIdleIdRef.current);
      }
      if (supplementaryTimerIdRef.current !== null) {
        window.clearTimeout(supplementaryTimerIdRef.current);
      }
    };
  }, []);

  const contextValue = useMemo<AppContextType>(
    () => ({
      homeData,
      parentCategories,
      childCategories,
      socialMedia,
      paymentMethods,
      loading,
      error,
      loadingHome,
      loadingCategories,
      appear_in_home_categories:
        homeData?.appear_in_home_categories || [],
      refreshAppData,
      hydrateInitialData,
      currentLanguage,
    }),
    [
      childCategories,
      currentLanguage,
      error,
      homeData,
      hydrateInitialData,
      loading,
      loadingCategories,
      loadingHome,
      parentCategories,
      paymentMethods,
      refreshAppData,
      socialMedia,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
