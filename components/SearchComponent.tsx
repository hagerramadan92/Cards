// components/SearchComponent.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CgSearch } from "react-icons/cg";
import { AiOutlineClose, AiOutlineDelete } from "react-icons/ai";
import { FiClock } from "react-icons/fi"; // ✅ استخدام FiClock بدل CgHistory
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/src/context/LanguageContext";
import { useSearchHistory } from "@/src/context/SearchHistoryContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  className?: string;
  setMenuOpen?: (open: boolean) => void;
}

interface SearchResult {
  id: number;
  name: string;
  price?: number;
  final_price?: number;
  image?: string;
}

const fetchSearchResults = async (query: string, language: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_URL}/products?search=${encodeURIComponent(query)}`, {
    headers: {
      "Accept-Language": language,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const data = await res.json();
  return data?.data || data || [];
};

export default function SearchComponent({ className = "", setMenuOpen }: Props) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { history, addToHistory, removeFromHistory, clearHistory, recentSearches } = useSearchHistory();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  const trimmed = useMemo(() => query.trim(), [query]);

  // ✅ React Query hook
  const {
    data: results = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["search", trimmed, language],
    queryFn: () => fetchSearchResults(trimmed, language),
    enabled: trimmed.length > 0 && open,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ✅ Update active index
  useEffect(() => {
    if (results.length > 0) {
      setActiveIndex(0);
      setShowHistory(false);
    } else {
      setActiveIndex(-1);
    }
  }, [results]);

  // ✅ Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowHistory(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goToSearchPage = (searchQuery?: string) => {
    const finalQuery = searchQuery || trimmed;
    if (!finalQuery) return;
    
    addToHistory(finalQuery);
    
    router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    setOpen(false);
    setShowHistory(false);
    setQuery("");
    setActiveIndex(-1);
  };

  const handleSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    goToSearchPage(searchQuery);
  };

  const clear = () => {
    setQuery("");
    setOpen(false);
    setShowHistory(false);
    setActiveIndex(-1);
  };

  // ✅ Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setShowHistory(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        addToHistory(trimmed);
        router.push(`/product/${results[activeIndex].id}`);
        clear();
        setMenuOpen?.(false);
        return;
      }
      if (trimmed) goToSearchPage();
      return;
    }

    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((p) => (p < results.length - 1 ? p + 1 : 0));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((p) => (p > 0 ? p - 1 : results.length - 1));
    }
  };

  const loading = isLoading || isFetching;

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setShowHistory(false);
          }}
          onFocus={() => {
            setOpen(true);
            if (!trimmed && history.length > 0) {
              setShowHistory(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={[
            "w-full",
            "input-dark",
            "rounded-full",
            "border",
            "px-4 py-3",
            "pe-4",
            "text-[0.98rem]",
            "outline-none",
            "transition-all duration-200",
            "focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10",
          ].join(" ")}
        />

        {/* Search icon */}
        <CgSearch
          size={20}
          className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute end-11 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full transition grid place-items-center"
            style={{ background: "var(--surface-subtle)" }}
          >
            <AiOutlineClose style={{ color: "var(--text-secondary)" }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-[22px] border shadow-xl animate-[fadeInUp_.18s_ease-out]" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          
          {/* 🟢 SEARCH HISTORY SECTION - باستخدام FiClock */}
          {showHistory && history.length > 0 && !trimmed && (
            <div className="border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--surface-subtle)" }}>
                <div className="flex items-center gap-2">
                  <FiClock className="text-slate-400" />
                  <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                    {t('recent_searches') || 'عمليات البحث الأخيرة'}
                  </span>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  {t('clear_all') || 'مسح الكل'}
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {recentSearches.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-2 group"
                  >
                    <button
                      onClick={() => handleSearchClick(item.query)}
                      className="flex-1 text-right"
                    >
                      <div className="flex items-center gap-3">
                        <FiClock className="text-slate-500 text-sm" />
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.query}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => removeFromHistory(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-white/10 rounded-full"
                      aria-label="Remove from history"
                    >
                      <AiOutlineClose size={14} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-3">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">{t('loading')}</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 text-center">
              <p className="text-red-600 font-bold">⚠️ {t('error') || 'حدث خطأ'}</p>
              <p className="text-xs text-gray-500 mt-1">{t('try_again')}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && trimmed && results.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-600 font-bold">{t('no_results')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('search_diff')}</p>

              {trimmed && (
                <button
                  type="button"
                  onClick={() => goToSearchPage()}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-pro text-white px-4 py-2 text-sm font-extrabold hover:opacity-95 transition"
                >
                  {t('search')} &quot;{trimmed}&quot;
                </button>
              )}
            </div>
          )}

          {/* Search Results */}
          {!loading && !error && trimmed && results.length > 0 && (
            <>
              <div className="max-h-96 overflow-y-auto">
                {results.map((item: SearchResult, idx: number) => {
                  const isActive = idx === activeIndex;

                  return (
                    <Link
                      href={`/product/${item.id}`}
                      key={item.id}
                      onClick={() => {
                        addToHistory(trimmed);
                        clear();
                        setMenuOpen?.(false);
                      }}
                      className={[
                        "block",
                        "px-4 py-3",
                        "border-b border-white/8 last:border-b-0",
                        "transition",
                        isActive ? "bg-white/8" : "hover:bg-white/4",
                      ].join(" ")}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-extrabold truncate" style={{ color: "var(--text-primary)" }}>
                            {item.name}
                          </p>
                          {(item.price || item.final_price) && (
                            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {item.final_price || item.price} {t('currency') || 'جنية'}
                            </p>
                          )}
                        </div>

                        <span className="text-xs font-bold shrink-0" style={{ color: "var(--text-muted)" }}>
                          {t('show')}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t flex items-center justify-between gap-2" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  ⚡ {results.length} {t('results')} • Enter لفتح • Esc للإغلاق
                </p>
                <button
                  type="button"
                  onClick={() => goToSearchPage()}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold border transition"
                  style={{ background: "var(--surface-glass)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  {t('all_results')} ({results.length})
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(6px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}
