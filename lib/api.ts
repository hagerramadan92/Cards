// lib/api.ts

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// دالة محسنة للحصول على header اللغة مع إمكانية تمرير اللغة
function getLanguageHeader(language?: string): string {
  if (typeof window !== "undefined") {
    return language || localStorage.getItem("language") || "ar";
  }
  return language || "ar";
}

// دالة fetchApi محسنة لدعم اللغة ديناميكياً
export async function fetchApi(
  endpoint: string, 
  options: RequestInit = {}, 
  language?: string
) {
  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": getLanguageHeader(language),
        ...options.headers,
      },
      mode: "cors",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    if (!data.status) throw new Error(data.message || "فشل جلب البيانات");

    return data.data;
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    throw err;
  }
}

// دالة fetchHomeData محسنة لدعم اللغة
export async function fetchHomeData(language?: string) {
  try {
    // تمرير اللغة إلى fetchApi مع حد عدد التصنيفات
    const data = await fetchApi("home?categories_limit=7", {}, language);
    return data;
  } catch (err) {
    console.error("Error fetching home data:", err);
    throw err;
  }
}

// دالة لإنشاء API client مع إدارة اللغة
export const createApiClient = () => {
  let currentLanguage = "ar";
  
  if (typeof window !== "undefined") {
    currentLanguage = localStorage.getItem("language") || "ar";
    
    // تحديث اللغة عند تغييرها
    window.addEventListener("languageChanged", (e: any) => {
      if (e.detail?.language) {
        currentLanguage = e.detail.language;
        console.log("API client language updated to:", currentLanguage);
      }
    });
  }
  
  return {
    setLanguage: (lang: string) => {
      currentLanguage = lang;
    },
    
    get: (endpoint: string, options?: RequestInit) => {
      return fetchApi(endpoint, { ...options, method: "GET" }, currentLanguage);
    },
    
    post: (endpoint: string, data: any, options?: RequestInit) => {
      return fetchApi(endpoint, {
        ...options,
        method: "POST",
        body: JSON.stringify(data),
      }, currentLanguage);
    },
    
    put: (endpoint: string, data: any, options?: RequestInit) => {
      return fetchApi(endpoint, {
        ...options,
        method: "PUT",
        body: JSON.stringify(data),
      }, currentLanguage);
    },
    
    delete: (endpoint: string, options?: RequestInit) => {
      return fetchApi(endpoint, { ...options, method: "DELETE" }, currentLanguage);
    },
  };
};


// fetchApi2 - للإشارة إلى روابط كاملة (full URLs)
export async function fetchApi2(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${endpoint}`, {
      ...options,
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": getLanguageHeader(),
        ...options.headers,
      },
      mode: "cors",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    if (!data.status) throw new Error(data.message || "فشل جلب البيانات");

    return data.data;
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    throw err;
  }
}


// إنشاء نسخة افتراضية
export const apiClient = createApiClient();