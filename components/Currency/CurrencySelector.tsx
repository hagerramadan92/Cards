"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiChevronDown } from "react-icons/bi";
import { useLanguage } from "@/src/context/LanguageContext";

interface Currency {
	code: string;
	name: string;
	symbol: string;
}

interface CountryFromIpResponse {
	country: string;
	currency: Currency;
}

// Fallback currencies
const fallbackCurrencies: Currency[] = [
	{ code: "EGP", name: "EGP", symbol: "EG" },
	{ code: "USD", name: "USD", symbol: "$" },
];

export default function CurrencySelector() {
	const { t, language } = useLanguage();
	const [currency, setCurrency] = useState<string>("EGP");
	const [currencies, setCurrencies] = useState<Currency[]>(fallbackCurrencies);
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const currentCurrency =
		currencies.find((c) => c.code === currency) || currencies[0];

	// Fetch currency from IP on mount
	useEffect(() => {
		const fetchCurrencyFromIp = async () => {
			if (!API_URL) {
				console.error("API_URL is not defined");
				setLoading(false);
				return;
			}

			try {
				// Check localStorage first for saved currency
				const savedCurrency = typeof window !== "undefined" 
					? localStorage.getItem("selected_currency") 
					: null;

				if (savedCurrency) {
					try {
						const parsed = JSON.parse(savedCurrency);
						if (parsed?.code) {
							setCurrency(parsed.code);
							setLoading(false);
						}
					} catch (e) {
						// Invalid saved currency, continue to fetch
					}
				}

				const res = await fetch(`${API_URL}/country-from-ip`, {
					method: "GET",
					headers: {
						Accept: "application/json",
						"Accept-Language": language || "ar",
					},
					cache: "no-store",
				});

				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status}`);
				}

				const data: CountryFromIpResponse = await res.json();

				if (data?.currency) {
					const apiCurrency: Currency = {
						code: data.currency.code,
						name: data.currency.name,
						symbol: data.currency.symbol,
					};

					// Create currencies list with API currency + fallbacks (avoid duplicates)
					const currencyList: Currency[] = [apiCurrency];
					fallbackCurrencies.forEach((fallback) => {
						if (fallback.code !== apiCurrency.code) {
							currencyList.push(fallback);
						}
					});

					setCurrencies(currencyList);

					// Set currency from API if no saved currency
					if (!savedCurrency) {
						setCurrency(apiCurrency.code);
						localStorage.setItem("selected_currency", JSON.stringify(apiCurrency));
					}
				}
			} catch (err) {
				console.error("Error fetching currency from IP:", err);
				// Use fallback currencies on error
				setCurrencies(fallbackCurrencies);
			} finally {
				setLoading(false);
			}
		};

		fetchCurrencyFromIp();
	}, [API_URL, language]);

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

	const handleCurrencyChange = (selectedCurrency: Currency) => {
		setCurrency(selectedCurrency.code);
		// Save to localStorage
		if (typeof window !== "undefined") {
			localStorage.setItem("selected_currency", JSON.stringify(selectedCurrency));
		}
		setIsOpen(false);
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				disabled={loading}
				className="flex items-center gap-1 md:gap-2 px-0 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				aria-label="Select currency"
				aria-expanded={isOpen}
			>
				{loading ? (
					<div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-pro"></div>
				) : (
					<>
						<span className="text-xs font-bold">{currentCurrency.symbol}</span>
						<span className="hidden sm:inline text-sm font-medium text-gray-700">
							{currentCurrency.code}
						</span>
						<BiChevronDown
							className={`w-3 h-3 md:w-4 md:h-4 text-gray-500 transition-transform ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
					</>
				)}
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
								onClick={() => handleCurrencyChange(curr)}
								className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
									currency === curr.code
										? "bg-blue-50/100 text-pro font-semibold"
										: "text-gray-700"
								}`}
							>
								<span className="text-xs font-bold">{curr.symbol}</span>
								<span>{curr.code}</span>
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
