"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { BiChevronDown, BiGlobe } from "react-icons/bi";
import { useRouter } from "next/navigation";

const flagMap: Record<string, string> = {
  en: "🇺🇸",
  ar: "🇸🇦", 
  fr: "🇫🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  it: "🇮🇹",
  ru: "🇷🇺",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

export default function LanguageSelector() {
  const router = useRouter();
  const { 
    language, 
    setLanguage, 
    availableLanguages, 
    isLoadingLanguages,
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = availableLanguages.map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: flagMap[lang.code] || "🌐"
  }));

  const currentLang = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode: string) => {
    try {
      setLanguage(langCode);
      
      const serverPreferenceUpdated = await sendLanguageChangeRequest(langCode);
      
      setIsOpen(false);

      if (serverPreferenceUpdated) {
        router.refresh();
      } else if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("languageServerRefreshFailed", {
            detail: { language: langCode },
          }),
        );
      }
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const sendLanguageChangeRequest = async (langCode: string) => {
    
    const languageChangeEndpoint = "/api/update-language-preference";
    
    try {
      const response = await fetch(languageChangeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": langCode,
        },
        body: JSON.stringify({
          language: langCode,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update language preference: ${response.status}`);
      }

      await response.json();
      return true;
    } catch {
      console.warn("Could not update server language preference, using client-side only");
      return false;
    }
  };

  // Rule of Hooks: Early returns must come AFTER all hook calls
  if (!mounted) {
    // Return a consistent placeholder that matches the server-side default (usually Arabic "ar")
    // This prevents the "Hydration failed" error by ensuring initial client render matches server HTML.
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 opacity-50"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            transitionProperty: "opacity, transform",
          }}
          aria-label="Select language"
          disabled
        >
          <span className="text-sm">🇸🇦</span>
          <span className="hidden text-sm font-medium sm:inline">
            العربية
          </span>
          <BiChevronDown className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    );
  }

  if (isLoadingLanguages && availableLanguages.length <= 3) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 animate-pulse"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            transitionProperty: "opacity, transform",
          }}
          aria-label="Loading languages"
          disabled
        >
          <BiGlobe className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">
            Loading...
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-selector-trigger flex items-center gap-2 rounded-lg border px-3 py-1.5"
        style={{ transitionProperty: "opacity, transform" }}
        aria-label="Select language"
        aria-expanded={isOpen}
        disabled={languages.length === 0}
      >
        <span className="text-sm">{currentLang?.flag || "🌐"}</span>
        <span className="hidden text-sm font-medium sm:inline">
          {currentLang?.name?.substring(0, 10) || language.toUpperCase()}
        </span>
        <BiChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="language-selector-menu absolute end-0 top-full z-50 mt-2 max-h-[400px] min-w-[200px] overflow-y-auto rounded-lg border shadow-lg"
          >
            
            {/* قائمة اللغات */}
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`language-selector-option flex w-full items-center gap-3 px-4 py-3 transition-colors ${
                    language === lang.code
                      ? "is-active border-s-2 font-semibold"
                      : ""
                  }`}
                  title={`Change language to ${lang.name} (${lang.code})`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-start">
                    <div className="font-medium">{lang.name}</div>
                  </div>
                  {language === lang.code && (
                    <span className="font-bold" style={{ color: "var(--primary)" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            
         
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
