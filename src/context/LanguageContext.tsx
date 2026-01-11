"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "ar" | "en";
type Direction = "rtl" | "ltr";

interface LanguageContextType {
	language: Language;
	direction: Direction;
	setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>("ar");
	const [direction, setDirection] = useState<Direction>("rtl");
	const [mounted, setMounted] = useState(false);

	// Load language from localStorage on mount
	useEffect(() => {
		setMounted(true);
		if (typeof window !== "undefined") {
			const savedLang = localStorage.getItem("language") as Language;
			if (savedLang && (savedLang === "ar" || savedLang === "en")) {
				setLanguageState(savedLang);
				const dir = savedLang === "ar" ? "rtl" : "ltr";
				setDirection(dir);
				document.documentElement.setAttribute("dir", dir);
				document.documentElement.setAttribute("lang", savedLang);
			}
		}
	}, []);

	// Update direction when language changes
	useEffect(() => {
		if (!mounted) return;
		const dir = language === "ar" ? "rtl" : "ltr";
		setDirection(dir);
		if (typeof window !== "undefined") {
			localStorage.setItem("language", language);
			document.documentElement.setAttribute("dir", dir);
			document.documentElement.setAttribute("lang", language);
		}
	}, [language, mounted]);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
	};

	return (
		<LanguageContext.Provider value={{ language, direction, setLanguage }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}

