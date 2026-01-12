"use client";

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import {
	FiUser,
	FiPhone,
	FiMail,
	FiMessageSquare,
	FiCopy,
	FiArrowUpRight,
	FiChevronDown,
	FiMapPin,
} from "react-icons/fi";

interface FormData {
	full_name: string;
	country: string;
	phone: string;
	email: string;
	address: string;
	message: string;
	suggestion_type: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

function Field({
	label,
	error,
	children,
	hint,
}: {
	label: string;
	error?: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<label className="text-sm font-extrabold text-slate-900">{label}</label>
				{hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
			</div>
			{children}
			{error ? (
				<p className="text-red-600 text-xs font-semibold">{error}</p>
			) : null}
		</div>
	);
}

function ActionPill({
	label,
	onClick,
	icon,
}: {
	label: string;
	onClick: () => void;
	icon: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
		>
			{icon}
			{label}
		</button>
	);
}

function InfoCard({
	title,
	value,
	icon,
	actions,
}: {
	title: string;
	value: string;
	icon: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
			<div className="flex items-start gap-4">
				<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-pro ring-1 ring-slate-200">
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
					<p className="mt-1 break-words text-slate-700 font-semibold text-sm">
						{value}
					</p>

					{actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
				</div>
			</div>

			<div className="mt-5 h-px w-full bg-gradient-to-l from-slate-200 via-slate-100 to-transparent" />

			<p className="mt-4 text-xs text-slate-500 leading-relaxed">
				لو بتحب، ابعت لنا رسالة من النموذج — بنرد عادةً خلال وقت قصير.
			</p>
		</div>
	);
}

export default function ContactPageOne() {
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
	const countryDropdownRef = useRef<HTMLDivElement>(null);
	const [form, setForm] = useState<FormData>({
		full_name: "",
		country: "EG",
		phone: "",
		email: "",
		address: "",
		message: "",
		suggestion_type: "",
	});

	const base_url = `${process.env.NEXT_PUBLIC_API_URL}/contact-us`;

	// Close country dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
				setCountryDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Country-specific phone validation patterns
	const phonePatterns: Record<string, { pattern: RegExp; example: string; message: string; flag: string; name: string; code: string }> = {
		EG: {
			pattern: /^01[0-9]{9}$/,
			example: "01012345678",
			message: "رقم الهاتف غير صحيح (مثال: 01012345678)",
			flag: "🇪🇬",
			name: "مصر",
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "🇸🇦",
			name: "السعودية",
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "🇦🇪",
			name: "الإمارات",
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			message: "رقم الهاتف غير صحيح (مثال: 51234567)",
			flag: "🇰🇼",
			name: "الكويت",
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			message: "رقم الهاتف غير صحيح (مثال: 33123456)",
			flag: "🇶🇦",
			name: "قطر",
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			message: "رقم الهاتف غير صحيح (مثال: 36123456)",
			flag: "🇧🇭",
			name: "البحرين",
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "🇴🇲",
			name: "عمان",
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			message: "رقم الهاتف غير صحيح (مثال: 0791234567)",
			flag: "🇯🇴",
			name: "الأردن",
			code: "+962",
		},
		LB: {
			pattern: /^[0-9]{8}$/,
			example: "12345678",
			message: "رقم الهاتف غير صحيح (مثال: 12345678)",
			flag: "🇱🇧",
			name: "لبنان",
			code: "+961",
		},
		IQ: {
			pattern: /^07[0-9]{9}$/,
			example: "07912345678",
			message: "رقم الهاتف غير صحيح (مثال: 07912345678)",
			flag: "🇮🇶",
			name: "العراق",
			code: "+964",
		},
		YE: {
			pattern: /^7[0-9]{8}$/,
			example: "712345678",
			message: "رقم الهاتف غير صحيح (مثال: 712345678)",
			flag: "🇾🇪",
			name: "اليمن",
			code: "+967",
		},
		SY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "🇸🇾",
			name: "سوريا",
			code: "+963",
		},
		PS: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "🇵🇸",
			name: "فلسطين",
			code: "+970",
		},
		MA: {
			pattern: /^06[0-9]{8}$/,
			example: "0612345678",
			message: "رقم الهاتف غير صحيح (مثال: 0612345678)",
			flag: "🇲🇦",
			name: "المغرب",
			code: "+212",
		},
		DZ: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: "رقم الهاتف غير صحيح (مثال: 0512345678)",
			flag: "🇩🇿",
			name: "الجزائر",
			code: "+213",
		},
		TN: {
			pattern: /^[2-9][0-9]{7}$/,
			example: "21234567",
			message: "رقم الهاتف غير صحيح (مثال: 21234567)",
			flag: "🇹🇳",
			name: "تونس",
			code: "+216",
		},
		LY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "🇱🇾",
			name: "ليبيا",
			code: "+218",
		},
		SD: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: "رقم الهاتف غير صحيح (مثال: 912345678)",
			flag: "🇸🇩",
			name: "السودان",
			code: "+249",
		},
		US: {
			pattern: /^[2-9][0-9]{9}$/,
			example: "2015551234",
			message: "رقم الهاتف غير صحيح (مثال: 2015551234)",
			flag: "🇺🇸",
			name: "الولايات المتحدة",
			code: "+1",
		},
		GB: {
			pattern: /^07[0-9]{9}$/,
			example: "07123456789",
			message: "رقم الهاتف غير صحيح (مثال: 07123456789)",
			flag: "🇬🇧",
			name: "المملكة المتحدة",
			code: "+44",
		},
		FR: {
			pattern: /^0[1-9][0-9]{8}$/,
			example: "0612345678",
			message: "رقم الهاتف غير صحيح (مثال: 0612345678)",
			flag: "🇫🇷",
			name: "فرنسا",
			code: "+33",
		},
		DE: {
			pattern: /^0[1-9][0-9]{9,10}$/,
			example: "01712345678",
			message: "رقم الهاتف غير صحيح (مثال: 01712345678)",
			flag: "🇩🇪",
			name: "ألمانيا",
			code: "+49",
		},
		IT: {
			pattern: /^3[0-9]{9}$/,
			example: "3123456789",
			message: "رقم الهاتف غير صحيح (مثال: 3123456789)",
			flag: "🇮🇹",
			name: "إيطاليا",
			code: "+39",
		},
		ES: {
			pattern: /^[6-9][0-9]{8}$/,
			example: "612345678",
			message: "رقم الهاتف غير صحيح (مثال: 612345678)",
			flag: "🇪🇸",
			name: "إسبانيا",
			code: "+34",
		},
		CA: {
			pattern: /^[2-9][0-9]{9}$/,
			example: "2045551234",
			message: "رقم الهاتف غير صحيح (مثال: 2045551234)",
			flag: "🇨🇦",
			name: "كندا",
			code: "+1",
		},
		AU: {
			pattern: /^04[0-9]{8}$/,
			example: "0412345678",
			message: "رقم الهاتف غير صحيح (مثال: 0412345678)",
			flag: "🇦🇺",
			name: "أستراليا",
			code: "+61",
		},
		TR: {
			pattern: /^05[0-9]{9}$/,
			example: "05123456789",
			message: "رقم الهاتف غير صحيح (مثال: 05123456789)",
			flag: "🇹🇷",
			name: "تركيا",
			code: "+90",
		},
		IN: {
			pattern: /^[6-9][0-9]{9}$/,
			example: "9123456789",
			message: "رقم الهاتف غير صحيح (مثال: 9123456789)",
			flag: "🇮🇳",
			name: "الهند",
			code: "+91",
		},
		CN: {
			pattern: /^1[3-9][0-9]{9}$/,
			example: "13812345678",
			message: "رقم الهاتف غير صحيح (مثال: 13812345678)",
			flag: "🇨🇳",
			name: "الصين",
			code: "+86",
		},
		JP: {
			pattern: /^0[789]0[0-9]{8}$/,
			example: "09012345678",
			message: "رقم الهاتف غير صحيح (مثال: 09012345678)",
			flag: "🇯🇵",
			name: "اليابان",
			code: "+81",
		},
		KR: {
			pattern: /^01[0-9]{8,9}$/,
			example: "01012345678",
			message: "رقم الهاتف غير صحيح (مثال: 01012345678)",
			flag: "🇰🇷",
			name: "كوريا الجنوبية",
			code: "+82",
		},
		BR: {
			pattern: /^[1-9][0-9]{10}$/,
			example: "11987654321",
			message: "رقم الهاتف غير صحيح (مثال: 11987654321)",
			flag: "🇧🇷",
			name: "البرازيل",
			code: "+55",
		},
		MX: {
			pattern: /^[1-9][0-9]{9}$/,
			example: "5512345678",
			message: "رقم الهاتف غير صحيح (مثال: 5512345678)",
			flag: "🇲🇽",
			name: "المكسيك",
			code: "+52",
		},
		RU: {
			pattern: /^9[0-9]{9}$/,
			example: "9123456789",
			message: "رقم الهاتف غير صحيح (مثال: 9123456789)",
			flag: "🇷🇺",
			name: "روسيا",
			code: "+7",
		},
	};

	const validate = useCallback((data: FormData) => {
		const newErrors: Errors = {};

		if (!data.full_name.trim()) newErrors.full_name = "الاسم الكامل مطلوب";

		if (!data.phone.trim()) {
			newErrors.phone = "رقم الهاتف مطلوب";
		} else if (data.country && phonePatterns[data.country]) {
			const phoneValidation = phonePatterns[data.country];
			if (!phoneValidation.pattern.test(data.phone.trim())) {
				newErrors.phone = phoneValidation.message;
			}
		} else if (data.country) {
			if (data.phone.trim().length < 8 || data.phone.trim().length > 15) {
				newErrors.phone = "رقم الهاتف غير صحيح";
			}
		}

		if (!data.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
			newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";

		if (!data.address.trim()) newErrors.address = "العنوان مطلوب";

		if (!data.suggestion_type.trim()) newErrors.suggestion_type = "نوع الاقتراح مطلوب";
		if (!data.message.trim()) newErrors.message = "الرسالة مطلوبة";

		return newErrors;
	}, []);

	const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

	const inputBase =
		"w-full rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition";

	const inputClass = useCallback(
		(field: keyof FormData) =>
			[
				inputBase,
				errors[field]
					? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
					: "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 duration-200",
			].join(" "),
		[errors]
	);

	const textareaClass = useCallback(
		(field: keyof FormData) =>
			[
				inputBase,
				"min-h-[150px] resize-none",
				errors[field]
					? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
					: "border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 duration-200",
			].join(" "),
		[errors]
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
			const { name, value } = e.target;
			setForm((prev) => ({ ...prev, [name]: value }));
			setErrors((prev) => ({ ...prev, [name]: "" }));
		},
		[]
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (loading) return;

			const newErrors = validate(form);
			setErrors(newErrors);
			if (Object.keys(newErrors).length) return;

			setLoading(true);

			try {
				const res = await fetch(base_url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...form,
						phone: form.phone.trim(),
						email: form.email.trim(),
					}),
				});

				const data = await res.json().catch(() => null);

				if (res.ok && data?.status) {
					Swal.fire({
						icon: "success",
						title: "تم الإرسال بنجاح",
						text: data?.message || "سنتواصل معك قريبًا.",
						confirmButtonText: "موافق",
					});

					setForm({
						full_name: "",
						country: "EG",
						phone: "",
						email: "",
						address: "",
						message: "",
						suggestion_type: "",
					});
					setErrors({});
					return;
				}

				Swal.fire({
					icon: "error",
					title: "خطأ",
					text: data?.message || "حدث خطأ أثناء الإرسال",
				});
			} catch {
				Swal.fire({
					icon: "error",
					title: "خطأ في الاتصال",
					text: "تعذر الاتصال بالسيرفر",
				});
			} finally {
				setLoading(false);
			}
		},
		[base_url, form, loading, validate]
	);

	// ===== Contact Data (edit freely) =====
	const hotline = "15829";
	const email = "hello@codexx.com";

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			Swal.fire({
				icon: "success",
				title: "تم النسخ",
				text: `تم نسخ ${label}`,
				timer: 1400,
				showConfirmButton: false,
			});
		} catch {
			Swal.fire({
				icon: "error",
				title: "تعذر النسخ",
				text: "الرجاء المحاولة مرة أخرى",
			});
		}
	};

	return (
		<section
		
			className="relative container overflow-hidden bg-white text-slate-800"
		>
			{/* Soft background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pro/10 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl" />
			</div>

			<div className="relative  container  pb-8 ">
				{/* Hero */}
				<div className="mb-5 text-center"> 
					<h1 className=" max-md:text-center mt-4 text-pro text-3xl md:text-4xl font-extrabold text-slate-950 leading-tight">
						اتصل <span className="text-pro-max">بنا</span>
					</h1>
					<p className="mt-2">
						اختر وسيلة التواصل المناسبة أو اترك رسالة عبر النموذج، وسنعود لك في أقرب وقت.
					</p>
				</div>

				{/* Content */}
				<div className="container">
					

					{/* Right: Form */}
					<div className="max-w-3xl mx-auto mt-0">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-0">
						

							<form
								onSubmit={handleSubmit}
								className="p-6 md:p-8 grid md:grid-cols-2 gap-5 mt-0"
							>
								<Field label="الإسم " error={errors.full_name}>
									<input
										name="full_name"
										value={form.full_name}
										onChange={handleChange}
										className={inputClass("full_name")}
										placeholder="أدخل الاسم كامل"
										autoComplete="given-name"
									/>
								</Field>

							
								<Field label="البريد الإلكتروني" error={errors.email}>
									<input
										name="email"
										type="text"
										value={form.email}
										onChange={handleChange}
										className={inputClass("email")}
										placeholder="example@email.com"
										autoComplete="email"
									/>
								</Field>

								

								<div className="md:col-span-2">
									<Field label="اختر نوع الاقتراح" error={errors.suggestion_type}>
										<div className="relative">
											<select
												name="suggestion_type"
												value={form.suggestion_type}
												onChange={handleChange}
												className={cn(
													inputClass("suggestion_type"),
													"appearance-none pe-10"
												)}
											>
												<option value="">اختر نوع الاقتراح</option>
												<option value="complaint">شكوى</option>
												<option value="suggestion">اقتراح</option>
												<option value="inquiry">استفسار</option>
												<option value="other">أخرى</option>
											</select>
											<FiChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
										</div>
									</Field>
								</div>
								<Field
									label="رقم الهاتف"
									error={errors.phone}
								>
									<div className="relative flex" dir="ltr">
										{/* Country Dropdown - Left side */}
										<div className="relative flex-shrink-0 w-20" ref={countryDropdownRef}>
											{/* Selected Country Button */}
											<button
												type="button"
												onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
												className={cn(
													"w-full rounded-l-lg border border-slate-200 bg-white px-2 py-3.5 text-sm font-semibold text-slate-900 outline-none transition border-r-0 cursor-pointer hover:bg-slate-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 flex items-center justify-between",
													errors.phone ? "border-red-400" : ""
												)}
											>
												{form.country && phonePatterns[form.country] ? (
													<div className="flex items-center gap-1.5">
														<span className={`fi fi-${form.country.toLowerCase()}`}></span>
														<span className="text-xs font-semibold text-slate-700">
															{phonePatterns[form.country].code}
														</span>
													</div>
												) : (
													<span>اختر البلد</span>
												)}
												<FiChevronDown className={`text-slate-400 text-xs transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
											</button>

											{/* Dropdown Options */}
											{countryDropdownOpen && (
												<div className="absolute top-full left-0 mt-1 w-[190px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
													{Object.entries(phonePatterns).map(([code, country]) => (
														<button
															key={code}
															type="button"
															onClick={() => {
																setForm((prev) => ({ ...prev, country: code }));
																setCountryDropdownOpen(false);
															}}
															className={cn(
																"w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
																form.country === code ? "bg-orange-50 text-orange-700 font-semibold" : "text-slate-900"
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
												name="phone"
												value={form.phone}
												onChange={handleChange}
												className={cn(
													inputClass("phone"),
													"rounded-l-none rounded-r-lg"
												)}
												placeholder={
													form.country && phonePatterns[form.country]
														? `مثال: ${phonePatterns[form.country].example}`
														: "أدخل رقم الهاتف"
												}
												inputMode="numeric"
											/>
										</div>
									</div>
								</Field>
								<Field label="العنوان" error={errors.address}>
									<input
										name="address"
										value={form.address}
										onChange={handleChange}
										className={inputClass("address")}
										placeholder="أدخل العنوان الكامل"
										autoComplete="street-address"
									/>
								</Field>
								<div className="md:col-span-2">
									<Field label="الرسالة" error={errors.message}>
										<textarea
											name="message"
											value={form.message}
											onChange={handleChange}
											rows={6}
											className={textareaClass("message")}
											placeholder="فضلاً اكتب رسالتك بالتفصيل..."
										/>
									</Field>
								</div>

								{/* Submit */}
								<div className="md:col-span-2 pt-1">
									<button
										type="submit"
										aria-label="submit form"
										disabled={loading}
										className={`
											w-full rounded-2xl py-3.5 font-extrabold text-white transition bg-pro-max
											${loading ? "bg-slate-400 cursor-not-allowed" : "bg-pro hover:opacity-95 active:scale-[0.99]"}
											`}
									>
										{loading ? (
											<span className="inline-flex items-center justify-center gap-2">
												<span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
												جاري الإرسال...
											</span>
										) : (
											"إرسال الرسالة"
										)}
									</button>

									{!loading && !isValid && Object.keys(errors).length ? (
										<p className="mt-3 text-xs text-slate-500">
											تأكد من إدخال البيانات بشكل صحيح قبل الإرسال.
										</p>
									) : null }
								</div>
							</form>
						</div>
 
					</div>
				</div>
			</div>
		</section>
	);
}
