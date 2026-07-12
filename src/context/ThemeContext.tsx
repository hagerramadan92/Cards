"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return "light";
		const currentTheme = document.documentElement.dataset.theme;
		if (currentTheme === "dark" || currentTheme === "light") return currentTheme;
		const savedTheme = window.localStorage.getItem("theme");
		return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
	});

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		window.localStorage.setItem("theme", theme);
	}, [theme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			setTheme: setThemeState,
			toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
		}),
		[theme]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used inside ThemeProvider");
	}
	return context;
}
