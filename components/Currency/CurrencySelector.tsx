"use client";

import { useState, useEffect } from "react";

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CountryLocation {
  country: string;
  currency: Currency;
}

const COUNTRY_CACHE_KEY = "country_currency_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function CurrencyDisplay() {
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
        const cachedValue = sessionStorage.getItem(COUNTRY_CACHE_KEY);

        if (cachedValue) {
          const parsedCache: {
            data: CountryLocation;
            expiresAt: number;
          } = JSON.parse(cachedValue);

          if (
            parsedCache?.data?.currency &&
            typeof parsedCache.expiresAt === "number" &&
            parsedCache.expiresAt > Date.now()
          ) {
            setCurrency(parsedCache.data.currency);
            setLoading(false);
            return;
          }

          sessionStorage.removeItem(COUNTRY_CACHE_KEY);
        }

        const res = await fetch(`${API_URL}/country-from-ip`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Language": "ar",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: CountryLocation = await res.json();
        if (data?.currency) {
          setCurrency(data.currency);
          sessionStorage.setItem(
            COUNTRY_CACHE_KEY,
            JSON.stringify({
              data,
              expiresAt: Date.now() + CACHE_TTL_MS,
            })
          );
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
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}>
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-orange-400"></div>
        <span className="text-sm text-slate-400">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}>
        <span className="text-sm text-red-300">Currency: N/A</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
      <span className="text-xs font-bold text-orange-300">{currency?.symbol}</span>
      <span className="text-sm font-medium">
        {currency?.code}
      </span>
    </div>
  );
}
