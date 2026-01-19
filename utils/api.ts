// lib/api.ts

// دالة fetch أساسية مع دعم Accept-Language
export const fetchWithLanguage = async (
  endpoint: string, 
  options: RequestInit = {},
  language: string = 'ar'
) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...options.headers,
  };

  console.log(`API Request to ${endpoint} with Accept-Language: ${language}`);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// دالة fetch عامة (تحتفظ بالتوافق مع الكود الحالي)
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // الحصول على اللغة الحالية من localStorage أو استخدام العربية كافتراضي
  let language = 'ar';
  if (typeof window !== 'undefined') {
    language = localStorage.getItem('language') || 'ar';
  }
  
  return fetchWithLanguage(endpoint, options, language);
};

// دالة fetchHomeData مع دعم اللغة
export const fetchHomeData = async (language?: string) => {
  const lang = language || (typeof window !== 'undefined' ? localStorage.getItem('language') : 'ar') || 'ar';
  return fetchWithLanguage('home', {}, lang);
};