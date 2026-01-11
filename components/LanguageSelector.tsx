"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { BiChevronDown } from "react-icons/bi";

const languages = [
	{ code: "ar" as const, name: "العربية", flag: "🇸🇦" },
	{ code: "en" as const, name: "English", flag: "🇬🇧" },
];

export default function LanguageSelector() {
	const { language, setLanguage } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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

	const handleLanguageChange = (langCode: "ar" | "en") => {
		setLanguage(langCode);
		setIsOpen(false);
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
				aria-label="Select language"
				aria-expanded={isOpen}
			>
				<span className="text-lg md:text-xl">{currentLang.flag}</span>
				<span className="hidden sm:inline text-sm font-medium text-gray-700">{currentLang.name}</span>
				<BiChevronDown
					className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]"
					>
						{languages.map((lang) => (
							<button
								key={lang.code}
								onClick={() => handleLanguageChange(lang.code)}
								className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
									language === lang.code ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
								}`}
							>
								<span className="text-lg">{lang.flag}</span>
								<span>{lang.name}</span>
								{language === lang.code && (
									<span className="ml-auto text-blue-600">✓</span>
								)}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

