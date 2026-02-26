// src/context/DataContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

interface AllSettings {
  phone: string;
  place: string;
  email_info: string;
  email_suppor: string;
  title_website: string;
}

interface TranslatedSettings {
  site_name: string;
  site_title: string;
  site_description: string;
  site_keywords: string;
}

interface Settings {
  language: string;
  direction: string;
  all_settings: AllSettings;
  translated_settings: TranslatedSettings;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface Location {
  country: string;
  currency: Currency;
}

interface Detected {
  requested_lang: string | null;
  accept_language: string;
  country: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: {
    settings: Settings;
    location: Location;
    detected: Detected;
  };
}

interface DataContextType {
  settings: Settings | null;
  location: Location | null;
  detected: Detected | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    if (!API_URL) {
      setError("API URL is not configured");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/setting`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Language": language,
        },
        next: { revalidate: 3600 } // إعادة التحقق كل ساعة
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response: ApiResponse = await res.json();
      
      if (response?.status && response?.data) {
        setSettings(response.data.settings);
        setLocation(response.data.location);
        setDetected(response.data.detected);
        setError(null);
      } else {
        throw new Error("Invalid API response structure");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [language]);

  const refreshData = async () => {
    setLoading(true);
    await fetchData();
  };

  return (
    <DataContext.Provider value={{ 
      settings, 
      location, 
      detected, 
      loading, 
      error, 
      refreshData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}