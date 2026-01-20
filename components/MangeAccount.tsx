"use client";

import React, { useState, useEffect, useRef } from "react";
import ChangePassword from "./ChangePassword";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
	HiOutlineShieldCheck,
	HiOutlineUserCircle,
	HiOutlineEnvelope,
	HiOutlineKey,
} from "react-icons/hi2";
import { FiChevronDown } from "react-icons/fi";
import { useLanguage } from "@/src/context/LanguageContext";
import { TranslationKey } from "@/src/translations";

export default function MangeAccount() {
	const { t, language } = useLanguage();
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [phoneCountry, setPhoneCountry] = useState("EG");
	const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
	const phoneCountryRef = useRef<HTMLDivElement>(null);
	const [nickname, setNickname] = useState("");
	const [joinEmailMenu, setJoinEmailMenu] = useState(false);

	const router = useRouter();

	// Phone country patterns
	const phonePatterns: Record<string, { pattern: RegExp; example: string; messageKey: TranslationKey; flag: string; nameKey: TranslationKey; code: string }> = {
		EG: {
			pattern: /^01[0-9]{9}$/,
			example: "01012345678",
			messageKey: "phone_invalid_with_example",
			flag: "eg",
			nameKey: "egypt",
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			messageKey: "phone_invalid_with_example",
			flag: "sa",
			nameKey: "saudi_arabia",
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			messageKey: "phone_invalid_with_example",
			flag: "ae",
			nameKey: "uae",
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			messageKey: "phone_invalid_with_example",
			flag: "kw",
			nameKey: "kuwait",
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			messageKey: "phone_invalid_with_example",
			flag: "qa",
			nameKey: "qatar",
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			messageKey: "phone_invalid_with_example",
			flag: "bh",
			nameKey: "bahrain",
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			messageKey: "phone_invalid_with_example",
			flag: "om",
			nameKey: "oman",
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			messageKey: "phone_invalid_with_example",
			flag: "jo",
			nameKey: "jordan",
			code: "+962",
		},
		LB: {
			pattern: /^[0-9]{8}$/,
			example: "12345678",
			messageKey: "phone_invalid_with_example",
			flag: "lb",
			nameKey: "lebanon",
			code: "+961",
		},
		IQ: {
			pattern: /^07[0-9]{9}$/,
			example: "07912345678",
			messageKey: "phone_invalid_with_example",
			flag: "iq",
			nameKey: "iraq",
			code: "+964",
		},
		YE: {
			pattern: /^7[0-9]{8}$/,
			example: "712345678",
			messageKey: "phone_invalid_with_example",
			flag: "ye",
			nameKey: "yemen",
			code: "+967",
		},
		SY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			messageKey: "phone_invalid_with_example",
			flag: "sy",
			nameKey: "syria",
			code: "+963",
		},
		PS: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			messageKey: "phone_invalid_with_example",
			flag: "ps",
			nameKey: "palestine",
			code: "+970",
		},
		MA: {
			pattern: /^06[0-9]{8}$/,
			example: "0612345678",
			messageKey: "phone_invalid_with_example",
			flag: "ma",
			nameKey: "morocco",
			code: "+212",
		},
		DZ: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			messageKey: "phone_invalid_with_example",
			flag: "dz",
			nameKey: "algeria",
			code: "+213",
		},
		TN: {
			pattern: /^[2-9][0-9]{7}$/,
			example: "21234567",
			messageKey: "phone_invalid_with_example",
			flag: "tn",
			nameKey: "tunisia",
			code: "+216",
		},
		LY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			messageKey: "phone_invalid_with_example",
			flag: "ly",
			nameKey: "libya",
			code: "+218",
		},
		SD: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			messageKey: "phone_invalid_with_example",
			flag: "sd",
			nameKey: "sudan",
			code: "+249",
		},
	};

	function cn(...c: (string | false | undefined | null)[]) {
		return c.filter(Boolean).join(" ");
	}


	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (phoneCountryRef.current && !phoneCountryRef.current.contains(event.target as Node)) {
				setPhoneCountryOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const fetchUserData = async (token: string) => {
		setIsFetching(true);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
				headers: { 
					Authorization: `Bearer ${token}`, 
					"Accept-Language": language,
					Accept: "application/json"
				},
				cache: "no-store",
			});

			const data = await res.json();

			if (!data.status) {
				Swal.fire({
					icon: "error",
					title: t('error'),
					text: data.message || t('error_loading'),
				});
				return;
			}

			const name = data?.data?.name || "";
			setFullName(name);
			setEmail(data?.data?.email || "");
			setPhoneNumber(data?.data?.phone || "");
			setNickname(data?.data?.nickname || "");
			setJoinEmailMenu(data?.data?.email_subscription || false);
		} catch {
			Swal.fire({
				icon: "error",
				title: t('connect_error'),
				text: t('error_loading'),
			});
		} finally {
			setIsFetching(false);
		}
	};

	useEffect(() => {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			Swal.fire({
				icon: "warning",
				title: t('please_login'),
				text: t('please_login'),
			});
			router.push("/login");
			return;
		}

		fetchUserData(token);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("auth_token");
			if (!token) {
				Swal.fire({
					icon: "warning",
					title: t('please_login'),
					text: t('please_login'),
				});
				router.push("/login");
				return;
			}

			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/update`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
					"Accept-Language": language,
					Accept: "application/json"
				},
				body: JSON.stringify({
					name: fullName,
					email: email,
					phone: phoneNumber,
					nickname: nickname,
					email_subscription: joinEmailMenu,
				}),
			});

			const data = await res.json();

			if (!data.status) {
				Swal.fire({
					icon: "error",
					title: t('error'),
					text: data.message || t('error_loading'),
				});
				return;
			}

			Swal.fire({
				icon: "success",
				title: t('success_save'),
				text: t('success_save'),
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: t('connect_error'),
				text: t('error_loading'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (isFetching) {
		return (
			<div className="space-y-6 max-w-4xl">
				{/* Account Card Skeleton */}
				<section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
					<div className="p-5 md:p-6 border-b border-slate-200">
						<div className="h-7 w-48 bg-slate-200 rounded animate-pulse"></div>
					</div>

					<div className="p-5 md:p-6">
						<div className="space-y-5">
							{/* Full Name Skeleton */}
							<div className="space-y-2">
								<div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
								<div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse"></div>
							</div>

							{/* Email Skeleton */}
							<div className="space-y-2">
								<div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
								<div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse"></div>
							</div>

							{/* Phone Number Skeleton */}
							<div className="space-y-2">
								<div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
								<div className="flex gap-0">
									<div className="h-12 w-20 bg-slate-100 rounded-l-lg animate-pulse"></div>
									<div className="h-12 flex-1 bg-slate-100 rounded-r-lg animate-pulse"></div>
								</div>
							</div>

							{/* Nickname Skeleton */}
							<div className="space-y-2">
								<div className="h-4 w-28 bg-slate-200 rounded animate-pulse"></div>
								<div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse"></div>
							</div>

							{/* Checkbox Skeleton */}
							<div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
								<div className="w-5 h-5 bg-slate-200 rounded animate-pulse mt-0.5"></div>
								<div className="flex-1 space-y-2">
									<div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
									<div className="h-3 w-64 bg-slate-200 rounded animate-pulse"></div>
								</div>
							</div>

							{/* Button Skeleton */}
							<div className="pt-2">
								<div className="h-12 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
							</div>
						</div>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl md:mt-0 mt-5">
			{/* Account Card */}
			<section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div className="p-5 md:p-6 border-b border-slate-200">
					<h2 className="text-xl md:text-2xl font-semibold text-slate-900">
						{t('my_details')}
					</h2>
				</div>

				<div className="p-5 md:p-6">
					<form className="space-y-5">
						{/* Full Name */}
						<Field
							label={t('full_name')}
							placeholder={t('enter_full_name')}
							value={fullName}
							onChange={setFullName}
							type="text"
						/>
						{/* Nickname */}
						<Field
							label={t('nickname')}
							placeholder={t('enter_nickname')}
							value={nickname}
							onChange={setNickname}
							type="text"
						/>

						{/* Email */}
						<Field
							label={t('email')}
							placeholder={t('enter_email')}
							value={email}
							onChange={setEmail}
							type="email"
						/>

						{/* Phone Number */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-slate-700">{t('phone_number')}</label>
							<div className="relative flex" dir="ltr">
								{/* Country Dropdown - Left side */}
								<div className="relative flex-shrink-0 w-20" ref={phoneCountryRef}>
									{/* Selected Country Button */}
									<button
										type="button"
										onClick={() => setPhoneCountryOpen(!phoneCountryOpen)}
										className={cn(
											"w-full rounded-l-lg h-full border border-slate-300 bg-white px-2 py-3 text-sm font-medium text-slate-900 outline-none transition border-r-0 cursor-pointer hover:bg-slate-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 flex items-center justify-between"
										)}
									>
										{phoneCountry && phonePatterns[phoneCountry] ? (
											<div className="flex items-center gap-1.5">
												<span className={`fi fi-${phoneCountry.toLowerCase()}`}></span>
												<span className="text-xs font-semibold text-slate-700">
													{phonePatterns[phoneCountry].code}
												</span>
											</div>
										) : (
											<span className="text-xs">{t('select')}</span>
										)}
										<FiChevronDown className={`text-slate-400 text-xs transition-transform ${phoneCountryOpen ? "rotate-180" : ""}`} />
									</button>

									{/* Dropdown Options */}
									{phoneCountryOpen && (
										<div className="absolute top-full left-0 mt-1 w-[190px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
											{Object.entries(phonePatterns).map(([code, country]) => (
												<button
													key={code}
													type="button"
													onClick={() => {
														setPhoneCountry(code);
														setPhoneCountryOpen(false);
													}}
													className={cn(
														"w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
														phoneCountry === code ? "bg-pro/10 text-pro font-semibold" : "text-slate-900"
													)}
												>
													<span className={`fi fi-${code.toLowerCase()}`}></span>
													<span className="flex-1">{t(country.nameKey)}</span>
													<span className="text-xs text-slate-500">{country.code}</span>
												</button>
											))}
										</div>
									)}
								</div>
								{/* Phone Input - Right side */}
								<div className="relative flex-1">
									<input
										type="tel"
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value)}
										placeholder={
											phoneCountry && phonePatterns[phoneCountry]
												? ` ${phonePatterns[phoneCountry].example}`
												: t('enter_phone_number')
										}
										inputMode="numeric"
										className="w-full rounded-r-lg rounded-l-none border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
									/>
								</div>
							</div>
						</div>

						

						{/* Email Menu Checkbox */}
						<div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
							<input
								type="checkbox"
								id="emailMenu"
								checked={joinEmailMenu}
								onChange={(e) => setJoinEmailMenu(e.target.checked)}
								className="mt-0.5 w-5 h-5 rounded border-slate-300   focus:ring-offset-0 cursor-pointer"
							/>
							<label htmlFor="emailMenu" className="flex-1 cursor-pointer">
								<div className="text-sm  text-slate-600 mb-1">
								{t('email_subscription')}
								</div>
								
							</label>
						</div>

						{/* Save Button */}
						<div className="pt-2">
							<button
								type="button"
								onClick={handleSave}
								disabled={isLoading}
								className="w-full md:w-auto md:min-w-[200px] rounded-lg bg-pro-max px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? t('saving') : t('save')}
							</button>
						</div>
					</form>
				</div>
			</section>

			
		</div>
	);
}

/* ---------------- Small UI helpers ---------------- */

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
}) {
	return (
		<div className="space-y-2">
			<label className="block text-sm font-medium text-slate-700">{label}</label>
			<input
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900
                   placeholder:text-slate-400 outline-none transition-colors
                   focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
			/>
		</div>
	);
}

function SettingRow({
	icon,
	title,
	description,
	right,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	right: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-start gap-3 min-w-0">
				<div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
					{icon}
				</div>
				<div className="min-w-0">
					<div className="text-sm md:text-base font-extrabold text-slate-900">
						{title}
					</div>
					<div className="mt-1 text-xs md:text-sm text-slate-500">
						{description}
					</div>
				</div>
			</div>

			<div className="shrink-0">{right}</div>
		</div>
	);
}
