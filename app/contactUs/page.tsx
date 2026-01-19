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
	FiAlertCircle,
	FiHelpCircle,
	FiMoreHorizontal,
} from "react-icons/fi";
import { HiLightBulb } from "react-icons/hi";
import { useLanguage } from "@/src/context/LanguageContext";

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
	const { t } = useLanguage();
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
				{t('contact_card_hint')}
			</p>
		</div>
	);
}

export default function ContactPageOne() {
	const { t, language } = useLanguage();
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
	const countryDropdownRef = useRef<HTMLDivElement>(null);
	const [suggestionTypeOpen, setSuggestionTypeOpen] = useState(false);
	const suggestionTypeRef = useRef<HTMLDivElement>(null);
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

	// Suggestion type options
	const suggestionTypes = [
		{ value: "complaint", label: t('complaint'), icon: FiAlertCircle, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
		{ value: "suggestion", label: t('suggestion'), icon: HiLightBulb, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
		{ value: "inquiry", label: t('inquiry'), icon: FiHelpCircle, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
		{ value: "other", label: t('other'), icon: FiMoreHorizontal, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
	];

	const selectedSuggestionType = suggestionTypes.find((t) => t.value === form.suggestion_type);

	// Close country dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
				setCountryDropdownOpen(false);
			}
			if (suggestionTypeRef.current && !suggestionTypeRef.current.contains(event.target as Node)) {
				setSuggestionTypeOpen(false);
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
			message: t('phone_invalid_with_example').replace("{example}", "01012345678"),
			flag: "🇪🇬",
			name: t('egypt'),
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('phone_invalid_with_example').replace("{example}", "0512345678"),
			flag: "🇸🇦",
			name: t('saudi_arabia'),
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('phone_invalid_with_example').replace("{example}", "0512345678"),
			flag: "🇦🇪",
			name: t('uae'),
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			message: t('phone_invalid_with_example').replace("{example}", "51234567"),
			flag: "🇰🇼",
			name: t('kuwait'),
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			message: t('phone_invalid_with_example').replace("{example}", "33123456"),
			flag: "🇶🇦",
			name: t('qatar'),
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			message: t('phone_invalid_with_example').replace("{example}", "36123456"),
			flag: "🇧🇭",
			name: t('bahrain'),
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			message: t('phone_invalid_with_example').replace("{example}", "912345678"),
			flag: "🇴🇲",
			name: t('oman'),
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			message: t('phone_invalid_with_example').replace("{example}", "0791234567"),
			flag: "🇯🇴",
			name: t('jordan'),
			code: "+962",
		},
		LB: {
			pattern: /^[0-9]{8}$/,
			example: "12345678",
			message: t('phone_invalid_with_example').replace("{example}", "12345678"),
			flag: "🇱🇧",
			name: t('lebanon'),
			code: "+961",
		},
		IQ: {
			pattern: /^07[0-9]{9}$/,
			example: "07912345678",
			message: t('phone_invalid_with_example').replace("{example}", "07912345678"),
			flag: "🇮🇶",
			name: t('iraq'),
			code: "+964",
		},
		YE: {
			pattern: /^7[0-9]{8}$/,
			example: "712345678",
			message: t('phone_invalid_with_example').replace("{example}", "712345678"),
			flag: "🇾🇪",
			name: t('yemen'),
			code: "+967",
		},
		SY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('phone_invalid_with_example').replace("{example}", "912345678"),
			flag: "🇸🇾",
			name: t('syria'),
			code: "+963",
		},
		PS: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('phone_invalid_with_example').replace("{example}", "0512345678"),
			flag: "🇵🇸",
			name: t('palestine'),
			code: "+970",
		},
		MA: {
			pattern: /^06[0-9]{8}$/,
			example: "0612345678",
			message: t('phone_invalid_with_example').replace("{example}", "0612345678"),
			flag: "🇲🇦",
			name: t('morocco'),
			code: "+212",
		},
		DZ: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('phone_invalid_with_example').replace("{example}", "0512345678"),
			flag: "🇩🇿",
			name: t('algeria'),
			code: "+213",
		},
		TN: {
			pattern: /^[2-9][0-9]{7}$/,
			example: "21234567",
			message: t('phone_invalid_with_example').replace("{example}", "21234567"),
			flag: "🇹🇳",
			name: t('tunisia'),
			code: "+216",
		},
		LY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('phone_invalid_with_example').replace("{example}", "912345678"),
			flag: "🇱🇾",
			name: t('libya'),
			code: "+218",
		},
		SD: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('phone_invalid_with_example').replace("{example}", "912345678"),
			flag: "🇸🇩",
			name: t('sudan'),
			code: "+249",
		},
		US: {
			pattern: /^[2-9][0-9]{9}$/,
			example: "2015551234",
			message: t('phone_invalid_with_example').replace("{example}", "2015551234"),
			flag: "🇺🇸",
			name: t('united_states'),
			code: "+1",
		},
		GB: {
			pattern: /^07[0-9]{9}$/,
			example: "07123456789",
			message: t('phone_invalid_with_example').replace("{example}", "07123456789"),
			flag: "🇬🇧",
			name: t('united_kingdom'),
			code: "+44",
		},
		FR: {
			pattern: /^0[1-9][0-9]{8}$/,
			example: "0612345678",
			message: t('phone_invalid_with_example').replace("{example}", "0612345678"),
			flag: "🇫🇷",
			name: t('france'),
			code: "+33",
		},
		DE: {
			pattern: /^0[1-9][0-9]{9,10}$/,
			example: "01712345678",
			message: t('phone_invalid_with_example').replace("{example}", "01712345678"),
			flag: "🇩🇪",
			name: t('germany'),
			code: "+49",
		},
		IT: {
			pattern: /^3[0-9]{9}$/,
			example: "3123456789",
			message: t('phone_invalid_with_example').replace("{example}", "3123456789"),
			flag: "🇮🇹",
			name: t('italy'),
			code: "+39",
		},
		ES: {
			pattern: /^[6-9][0-9]{8}$/,
			example: "612345678",
			message: t('phone_invalid_with_example').replace("{example}", "612345678"),
			flag: "🇪🇸",
			name: t('spain'),
			code: "+34",
		},
		CA: {
			pattern: /^[2-9][0-9]{9}$/,
			example: "2045551234",
			message: t('phone_invalid_with_example').replace("{example}", "2045551234"),
			flag: "🇨🇦",
			name: t('canada'),
			code: "+1",
		},
		AU: {
			pattern: /^04[0-9]{8}$/,
			example: "0412345678",
			message: t('phone_invalid_with_example').replace("{example}", "0412345678"),
			flag: "🇦🇺",
			name: t('australia'),
			code: "+61",
		},
		TR: {
			pattern: /^05[0-9]{9}$/,
			example: "05123456789",
			message: t('phone_invalid_with_example').replace("{example}", "05123456789"),
			flag: "🇹🇷",
			name: t('turkey'),
			code: "+90",
		},
		IN: {
			pattern: /^[6-9][0-9]{9}$/,
			example: "9123456789",
			message: t('phone_invalid_with_example').replace("{example}", "9123456789"),
			flag: "🇮🇳",
			name: t('india'),
			code: "+91",
		},
		CN: {
			pattern: /^1[3-9][0-9]{9}$/,
			example: "13812345678",
			message: t('phone_invalid_with_example').replace("{example}", "13812345678"),
			flag: "🇨🇳",
			name: t('china'),
			code: "+86",
		},
		JP: {
			pattern: /^0[789]0[0-9]{8}$/,
			example: "09012345678",
			message: t('phone_invalid_with_example').replace("{example}", "09012345678"),
			flag: "🇯🇵",
			name: t('japan'),
			code: "+81",
		},
		KR: {
			pattern: /^01[0-9]{8,9}$/,
			example: "01012345678",
			message: t('phone_invalid_with_example').replace("{example}", "01012345678"),
			flag: "🇰🇷",
			name: t('south_korea'),
			code: "+82",
		},
		BR: {
			pattern: /^[1-9][0-9]{10}$/,
			example: "11987654321",
			message: t('phone_invalid_with_example').replace("{example}", "11987654321"),
			flag: "🇧🇷",
			name: t('brazil'),
			code: "+55",
		},
		MX: {
			pattern: /^[1-9][0-9]{9}$/,
			example: "5512345678",
			message: t('phone_invalid_with_example').replace("{example}", "5512345678"),
			flag: "🇲🇽",
			name: t('mexico'),
			code: "+52",
		},
		RU: {
			pattern: /^9[0-9]{9}$/,
			example: "9123456789",
			message: t('phone_invalid_with_example').replace("{example}", "9123456789"),
			flag: "🇷🇺",
			name: t('russia'),
			code: "+7",
		},
	};

	const validate = useCallback((data: FormData) => {
		const newErrors: Errors = {};

		if (!data.full_name.trim()) newErrors.full_name = t('full_name_required');

		if (!data.phone.trim()) {
			newErrors.phone = t('phone_required');
		} else if (data.country && phonePatterns[data.country]) {
			const phoneValidation = phonePatterns[data.country];
			if (!phoneValidation.pattern.test(data.phone.trim())) {
				newErrors.phone = phoneValidation.message;
			}
		} else if (data.country) {
			if (data.phone.trim().length < 8 || data.phone.trim().length > 15) {
				newErrors.phone = t('invalid_phone');
			}
		}

		if (!data.email.trim()) newErrors.email = t('email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
			newErrors.email = t('email_invalid');

		if (!data.address.trim()) newErrors.address = t('address_details_required');

		if (!data.suggestion_type.trim()) newErrors.suggestion_type = t('required_field');
		if (!data.message.trim()) newErrors.message = t('required_field');

		return newErrors;
	}, [t, phonePatterns]);

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
					headers: { 
						"Content-Type": "application/json",
						"Accept": "application/json",
						"Accept-Language": language
					},
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
						title: t('sent_success'),
						text: data?.message || t('contact_soon_note'),
						confirmButtonText: t('close'),
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
					title: t('error'),
					text: data?.message || t('send_error'),
				});
			} catch {
				Swal.fire({
					icon: "error",
					title: t('connect_error'),
					text: t('server_error'),
				});
			} finally {
				setLoading(false);
			}
		},
		[base_url, form, loading, validate, t]
	);



	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			Swal.fire({
				icon: "success",
				title: t('copied'),
				text: `${t('copied')} ${label}`,
				timer: 1400,
				showConfirmButton: false,
			});
		} catch {
			Swal.fire({
				icon: "error",
				title: t('error'),
				text: t('connect_error'),
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
						{t('contact')} <span className="text-pro-max">{t('us')}</span>
					</h1>
					<p className="mt-2">
						{t('contact_subtitle')}
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
								<Field label={t('full_name')} error={errors.full_name}>
									<input
										name="full_name"
										value={form.full_name}
										onChange={handleChange}
										className={inputClass("full_name")}
										placeholder={t('enter_full_name')}
										autoComplete="given-name"
									/>
								</Field>

							
								<Field label={t('email')} error={errors.email}>
									<input
										name="email"
										type="text"
										value={form.email}
										onChange={handleChange}
										className={inputClass("email")}
										placeholder={t('email_or_phone_placeholder')}
										autoComplete="email"
									/>
								</Field>

								

								<div className="md:col-span-2">
									<Field label={t('select_suggestion_type')} error={errors.suggestion_type}>
										<div ref={suggestionTypeRef} className="relative">
											{/* Custom Dropdown Button */}
											<button
												type="button"
												onClick={() => setSuggestionTypeOpen(!suggestionTypeOpen)}
												className={cn(
													"w-full rounded-2xl border bg-white px-4 py-3.5 text-sm font-semibold outline-none transition-all duration-200 flex items-center justify-between",
													errors.suggestion_type
														? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
														: "border-slate-200 hover:border-slate-300 focus:border-pro focus:ring-2 focus:ring-pro/20",
													suggestionTypeOpen && "border-pro ring-2 ring-pro/20"
												)}
											>
												<div className="flex items-center gap-3">
													{selectedSuggestionType ? (
														<>
															<div className={cn("p-2 rounded-lg", selectedSuggestionType.bgColor)}>
																<selectedSuggestionType.icon className={cn("w-4 h-4", selectedSuggestionType.color)} />
															</div>
															<span className="text-slate-900">{selectedSuggestionType.label}</span>
														</>
													) : (
														<span className="text-slate-400">{t('select_suggestion_type')}</span>
													)}
												</div>
												<FiChevronDown
													className={cn(
														"text-slate-400 transition-transform duration-200",
														suggestionTypeOpen && "rotate-180"
													)}
												/>
											</button>

											{/* Dropdown Menu */}
											{suggestionTypeOpen && (
												<div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
													<div className="py-1">
														{suggestionTypes.map((type) => {
															const Icon = type.icon;
															const isSelected = form.suggestion_type === type.value;
															return (
																<button
																	key={type.value}
																	type="button"
																	onClick={() => {
																		setForm((prev) => ({ ...prev, suggestion_type: type.value }));
																		setSuggestionTypeOpen(false);
																		if (errors.suggestion_type) {
																			setErrors((prev) => ({ ...prev, suggestion_type: undefined }));
																		}
																	}}
																	className={cn(
																		"w-full flex items-center gap-3 px-4 py-3 text-right transition-colors",
																		isSelected
																			? cn(type.bgColor, type.color, "font-bold")
																			: "text-slate-700 hover:bg-slate-50"
																	)}
																>
																	<div
																		className={cn(
																			"p-2 rounded-lg transition-colors",
																			isSelected ? type.bgColor : "bg-slate-100"
																		)}
																	>
																		<Icon
																			className={cn(
																				"w-4 h-4",
																				isSelected ? type.color : "text-slate-600"
																			)}
																		/>
																	</div>
																	<span className="flex-1">{type.label}</span>
																	{isSelected && (
																		<div className={cn("w-2 h-2 rounded-full", type.bgColor.replace("50", "500"))} />
																	)}
																</button>
															);
														})}
													</div>
												</div>
											)}
										</div>
									</Field>
								</div>
								<Field
									label={t('phone_number')}
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
													<span>{t('select_country')}</span>
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
														? ` ${phonePatterns[form.country].example}`
														: t('enter_phone_number')
												}
												inputMode="numeric"
											/>
										</div>
									</div>
								</Field>

								
									<Field label={t('address')} error={errors.address}>
										<div className="relative">
											<span className="absolute right-4 top-3.5 text-slate-400">
												<FiMapPin />
											</span>
											<input
												name="address"
												value={form.address}
												onChange={handleChange}
												className={cn(inputClass("address"), "pr-11")}
												placeholder={t('enter_address')}
											/>
										</div>
									</Field>
								

								<div className="md:col-span-2">
									<Field label={t('message')} error={errors.message}>
										<div className="relative">
											<span className="absolute right-4 top-3.5 text-slate-400">
												<FiMessageSquare />
											</span>
											<textarea
												name="message"
												value={form.message}
												onChange={handleChange}
												className={cn(textareaClass("message"), "pr-11")}
												placeholder={t('how_can_we_help')}
											/>
										</div>
									</Field>
								</div>

								<div className="md:col-span-2 pt-2">
									<button
										type="submit"
										disabled={loading}
										className={cn(
											"w-full flex items-center justify-center gap-3 rounded-2xl bg-pro px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-pro/20 transition-all duration-300 hover:bg-pro-max hover:shadow-pro/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed",
											loading && "animate-pulse"
										)}
									>
										{loading ? (
											<>
												<div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
												<span>{t('sending')}</span>
											</>
										) : (
											<>
												<FiArrowUpRight className="text-lg" />
												<span>{t('send_message')}</span>
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>

					
				</div>
			</div>
		</section>
	);
}
