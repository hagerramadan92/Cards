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

export default function MangeAccount() {
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
	const phonePatterns: Record<string, { pattern: RegExp; example: string; message: string; flag: string; name: string; code: string }> = {
		EG: {
			pattern: /^01[0-9]{9}$/,
			example: "01012345678",
			message: "رقم الهاتف غير صحيح (مثال: 01012345678)",
			flag: "eg",
			name: "مصر",
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "sa",
			name: "السعودية",
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "ae",
			name: "الإمارات",
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			message: "رقم الهاتف غير صحيح (مثال: 51234567)",
			flag: "kw",
			name: "الكويت",
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			message: "رقم الهاتف غير صحيح (مثال: 33123456)",
			flag: "qa",
			name: "قطر",
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			message: "رقم الهاتف غير صحيح (مثال: 36123456)",
			flag: "bh",
			name: "البحرين",
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "om",
			name: "عمان",
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			message: "رقم الهاتف غير صحيح (مثال: 0791234567)",
			flag: "jo",
			name: "الأردن",
			code: "+962",
		},
		LB: {
			pattern: /^[0-9]{8}$/,
			example: "12345678",
			message: "رقم الهاتف غير صحيح (مثال: 12345678)",
			flag: "lb",
			name: "لبنان",
			code: "+961",
		},
		IQ: {
			pattern: /^07[0-9]{9}$/,
			example: "07912345678",
			message: "رقم الهاتف غير صحيح (مثال: 07912345678)",
			flag: "iq",
			name: "العراق",
			code: "+964",
		},
		YE: {
			pattern: /^7[0-9]{8}$/,
			example: "712345678",
			message: "رقم الهاتف غير صحيح (مثال: 712345678)",
			flag: "ye",
			name: "اليمن",
			code: "+967",
		},
		SY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "sy",
			name: "سوريا",
			code: "+963",
		},
		PS: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "ps",
			name: "فلسطين",
			code: "+970",
		},
		MA: {
			pattern: /^06[0-9]{8}$/,
			example: "0612345678",
			message: "رقم الهاتف غير صحيح (مثال: 0612345678)",
			flag: "ma",
			name: "المغرب",
			code: "+212",
		},
		DZ: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "dz",
			name: "الجزائر",
			code: "+213",
		},
		TN: {
			pattern: /^[2-9][0-9]{7}$/,
			example: "21234567",
			message: "رقم الهاتف غير صحيح (مثال: 21234567)",
			flag: "tn",
			name: "تونس",
			code: "+216",
		},
		LY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "ly",
			name: "ليبيا",
			code: "+218",
		},
		SD: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "sd",
			name: "السودان",
			code: "+249",
		},
	};

	function cn(...c: (string | false | undefined | null)[]) {
		return c.filter(Boolean).join(" ");
	}
		function getLanguage(): string {
		if (typeof window !== "undefined") {
			return localStorage.getItem("language") || "ar";
		}
		return "ar";
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
				headers: { Authorization: `Bearer ${token}` , "Accept-Language": getLanguage(),  },
				cache: "no-store",
			});

			const data = await res.json();

			if (!data.status) {
				Swal.fire({
					icon: "error",
					title: "خطأ",
					text: data.message || "حدث خطأ أثناء تحميل البيانات",
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
				title: "خطأ في الاتصال",
				text: "تعذر الاتصال بالسيرفر",
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
				title: "يجب تسجيل الدخول",
				text: "فضلاً قم بتسجيل الدخول أولاً",
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
					title: "يجب تسجيل الدخول",
					text: "فضلاً قم بتسجيل الدخول أولاً",
				});
				router.push("/login");
				return;
			}

			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/update`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
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
					title: "خطأ",
					text: data.message || "حدث خطأ أثناء حفظ البيانات",
				});
				return;
			}

			Swal.fire({
				icon: "success",
				title: "تم الحفظ بنجاح",
				text: "تم تحديث بياناتك بنجاح",
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "خطأ في الاتصال",
				text: "تعذر الاتصال بالسيرفر",
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
		<div className="space-y-6 max-w-4xl">
			{/* Account Card */}
			<section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div className="p-5 md:p-6 border-b border-slate-200">
					<h2 className="text-xl md:text-2xl font-semibold text-slate-900">
						التفاصيل الخاصة بي
					</h2>
				</div>

				<div className="p-5 md:p-6">
					<form className="space-y-5">
						{/* Full Name */}
						<Field
							label="الاسم الكامل"
							placeholder="أدخل الاسم الكامل"
							value={fullName}
							onChange={setFullName}
							type="text"
						/>
						{/* Nickname */}
						<Field
							label="الاسم المستعار"
							placeholder="أدخل الاسم المستعار"
							value={nickname}
							onChange={setNickname}
							type="text"
						/>

						{/* Email */}
						<Field
							label="البريد الإلكتروني"
							placeholder="أدخل البريد الإلكتروني"
							value={email}
							onChange={setEmail}
							type="email"
						/>

						{/* Phone Number */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-slate-700">رقم الهاتف</label>
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
											<span className="text-xs">اختر</span>
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
													<span className="flex-1">{country.name}</span>
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
												: "أدخل رقم الهاتف"
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
								الاشتراك بالقائمة البريديّة.
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
								{isLoading ? "جاري الحفظ..." : "حفظ "}
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
