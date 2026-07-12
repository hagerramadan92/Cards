"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/src/context/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
			title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
			className={`theme-toggle ${className}`}
		>
			{isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
			<span className="max-md:hidden">{isDark ? "لايت" : "دارك"}</span>
		</button>
	);
}
