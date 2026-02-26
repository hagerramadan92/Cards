// hooks/useCurrency.ts
import { useState, useEffect } from "react";
import { useLanguage } from "@/src/context/LanguageContext";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface Location {
  country: string;
  currency: Currency;
}

interface Settings {
  language: string;
  direction: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: {
    settings: Settings;
    location: Location;
  };
}

export function useCurrency() {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCurrency = async () => {
      if (!API_URL) {
        console.error("API_URL is not defined");
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
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        if (data?.status && data?.data?.location?.currency) {
          setCurrency(data.data.location.currency);
        } else {
          throw new Error("Invalid API response structure");
        }
      } catch (err) {
        console.error("Error fetching currency:", err);
        setError("Failed to load currency");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [API_URL, language]);

  return { currency, loading, error };
}