// src/context/SearchHistoryContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLanguage } from "./LanguageContext";

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  language: string;
}

interface SearchHistoryContextType {
  history: SearchHistoryItem[];
  addToHistory: (query: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  recentSearches: SearchHistoryItem[]; // آخر 5 عمليات بحث
}

const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = "search_history";

export function SearchHistoryProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // ✅ Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, []);

  // ✅ Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }, [history]);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    
    setHistory(prev => {
      // ✅ Remove duplicate if exists
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== trimmedQuery.toLowerCase()
      );

      // ✅ Add new item at the beginning
      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: trimmedQuery,
        timestamp: Date.now(),
        language
      };

      // ✅ Keep only last MAX_HISTORY_ITEMS
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  // ✅ Get recent searches (last 5)
  const recentSearches = history.slice(0, 5);

  return (
    <SearchHistoryContext.Provider value={{
      history,
      addToHistory,
      removeFromHistory,
      clearHistory,
      recentSearches
    }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error("useSearchHistory must be used within a SearchHistoryProvider");
  }
  return context;
}