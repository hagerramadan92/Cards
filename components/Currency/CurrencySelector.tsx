"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiChevronDown } from "react-icons/bi";
import { useLanguage } from "@/src/context/LanguageContext";

const currencies = [
	{ code: "EGP", name: "جنية", symbol: "ج.م" },
	{ code: "USD", name: "دولار", symbol: "$" },
];

export default function CurrencySelector() {
	const { t } = useLanguage();
	const [currency, setCurrency] = useState("EGP");
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const currentCurrency =
		currencies.find((c) => c.code === currency) || currencies[0];

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleCurrencyChange = (code: string) => {
		setCurrency(code);
		setIsOpen(false);
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-1 md:gap-2 px-0 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
				aria-label="Select currency"
				aria-expanded={isOpen}
			>
				<span className="text-xs font-bold">{currentCurrency.symbol}</span>
				<span className="hidden sm:inline text-sm font-medium text-gray-700">
					{currentCurrency.name}
				</span>
				<BiChevronDown
					className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="absolute top-full end-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]"
					>
						{currencies.map((curr) => (
							<button
								key={curr.code}
								onClick={() => handleCurrencyChange(curr.code)}
								className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
									currency === curr.code
										? "bg-blue-50/100 text-pro font-semibold"
										: "text-gray-700"
								}`}
							>
								<span className="text-xs font-bold">{curr.symbol}</span>
								<span>{curr.name}</span>
								{currency === curr.code && (
									<span className="ml-auto text-pro">✓</span>
								)}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
