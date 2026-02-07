"use client";

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

export default function CurrencyDisplay() {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch currency from API on mount
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
			console.log(data);
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-pro"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-sm text-red-500">Currency: N/A</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-xs font-bold">{currency?.symbol}</span>
      <span className="text-sm font-medium text-gray-700">
        {currency?.code}
      </span>
    </div>
  );
}