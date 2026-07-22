"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const themeListeners = new Set<() => void>();

function getServerThemeSnapshot(): Theme {
	return "light";
}

function getThemeSnapshot(): Theme {
	if (typeof document === "undefined") return getServerThemeSnapshot();

	const currentTheme = document.documentElement.dataset.theme;
	if (currentTheme === "dark" || currentTheme === "light") return currentTheme;

	try {
		const savedTheme = window.localStorage.getItem("theme");
		return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
	} catch {
		return "light";
	}
}

function subscribeToTheme(listener: () => void) {
	themeListeners.add(listener);
	window.addEventListener("storage", listener);

	return () => {
		themeListeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
}

function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;

	try {
		window.localStorage.setItem("theme", theme);
	} catch {
		// The visual theme still works when storage is unavailable.
	}

	themeListeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const theme = useSyncExternalStore(
		subscribeToTheme,
		getThemeSnapshot,
		getServerThemeSnapshot,
	);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			setTheme: applyTheme,
			toggleTheme: () => applyTheme(theme === "dark" ? "light" : "dark"),
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
