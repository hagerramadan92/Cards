'use client';

import React, { useCallback, useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import {
	FiUser,
	FiPhone,
	FiMail,
	FiMessageSquare,
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

interface TicketFormCustomProps {
	onClose?: () => void;
	onSuccess?: () => void;
}

export default function TicketForm({ onClose, onSuccess }: TicketFormCustomProps) {
	const { t } = useLanguage();
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

	// Suggestion type options
	const suggestionTypes = [
		{ value: "complaint", label: t('support.types.complaint'), icon: FiAlertCircle, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
		{ value: "suggestion", label: t('support.types.suggestion'), icon: HiLightBulb, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
		{ value: "inquiry", label: t('support.types.inquiry'), icon: FiHelpCircle, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
		{ value: "other", label: t('support.types.other' as any), icon: FiMoreHorizontal, color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
	];

	const selectedSuggestionType = suggestionTypes.find((t) => t.value === form.suggestion_type);

	// Close dropdowns when clicking outside
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

	// Phone patterns (مختصرة للدول الرئيسية)
	const phonePatterns: Record<string, { pattern: RegExp; example: string; message: string; flag: string; name: string; code: string }> = {
		EG: {
			pattern: /^01[0-9]{9}$/,
			example: "01012345678",
			message: t('ticket.phone.invalid_eg'),
			flag: "🇪🇬",
			name: t('country.eg'),
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('ticket.phone.invalid_sa'),
			flag: "🇸🇦",
			name: t('country.sa'),
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('ticket.phone.invalid_ae'),
			flag: "🇦🇪",
			name: t('country.ae'),
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			message: t('ticket.phone.invalid_kw'),
			flag: "🇰🇼",
			name: t('country.kw'),
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			message: t('ticket.phone.invalid_qa'),
			flag: "🇶🇦",
			name: t('country.qa'),
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			message: t('ticket.phone.invalid_bh'),
			flag: "🇧🇭",
			name: t('country.bh'),
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			message: t('ticket.phone.invalid_om'),
			flag: "🇴🇲",
			name: t('country.om'),
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			message: t('ticket.phone.invalid_jo'),
			flag: "🇯🇴",
			name: t('country.jo'),
			code: "+962",
		},
	};

	const validate = useCallback((data: FormData) => {
		const newErrors: Errors = {};

		if (!data.full_name.trim()) newErrors.full_name = t('ticket.field.full_name_required');

		if (!data.phone.trim()) {
			newErrors.phone = t('ticket.field.phone_required');
		} else if (data.country && phonePatterns[data.country]) {
			const phoneValidation = phonePatterns[data.country];
			if (!phoneValidation.pattern.test(data.phone.trim())) {
				newErrors.phone = phoneValidation.message;
			}
		}

		if (!data.email.trim()) newErrors.email = t('ticket.field.email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
			newErrors.email = t('ticket.field.email_invalid');

		if (!data.address.trim()) newErrors.address = t('ticket.field.address_required');
		if (!data.suggestion_type.trim()) newErrors.suggestion_type = t('ticket.field.type_required');
		if (!data.message.trim()) newErrors.message = t('ticket.field.message_required');

		return newErrors;
	}, [phonePatterns, t]);

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
				// محاكاة إرسال البيانات
				await new Promise(resolve => setTimeout(resolve, 1500));
				
				Swal.fire({
					icon: "success",
					title: t('alert.success'),
					text: t('alert.success_message'),
					confirmButtonText: t('common.ok' as any),
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
				
				if (onSuccess) onSuccess();
				if (onClose) onClose();
				
			} catch {
				Swal.fire({
					icon: "error",
					title: t('common.error' as any),
					text: t('alert.error_message'),
				});
			} finally {
				setLoading(false);
			}
		},
		[form, loading, validate, onSuccess, onClose, t]
	);

	return (
		<div className="p-6 md:p-8">
			<form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
				<Field label={t('ticket.field.full_name')} error={errors.full_name}>
					<input
						name="full_name"
						value={form.full_name}
						onChange={handleChange}
						className={inputClass("full_name")}
						placeholder={t('ticket.field.full_name_placeholder')}
						autoComplete="given-name"
					/>
				</Field>

				<Field label={t('ticket.field.email')} error={errors.email}>
					<input
						name="email"
						type="text"
						value={form.email}
						onChange={handleChange}
						className={inputClass("email")}
						placeholder={t('ticket.field.email_placeholder')}
						autoComplete="email"
					/>
				</Field>

				<div className="md:col-span-2">
					<Field label={t('ticket.field.type')} error={errors.suggestion_type}>
						<div ref={suggestionTypeRef} className="relative">
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
										<span className="text-slate-400">{t('ticket.form.select_type')}</span>
									)}
								</div>
								<FiChevronDown
									className={cn(
										"text-slate-400 transition-transform duration-200",
										suggestionTypeOpen && "rotate-180"
									)}
								/>
							</button>

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

				<Field label={t('ticket.field.phone')} error={errors.phone}>
					<div className="relative flex" dir="ltr">
						<div className="relative flex-shrink-0 w-20" ref={countryDropdownRef}>
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
										<span>{phonePatterns[form.country].flag}</span>
										<span className="text-xs font-semibold text-slate-700">
											{phonePatterns[form.country].code}
										</span>
									</div>
								) : (
									<span>🇪🇬</span>
								)}
								<FiChevronDown className={`text-slate-400 text-xs transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
							</button>

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
											<span>{country.flag}</span>
											<span className="flex-1">{country.name}</span>
											<span className="text-xs text-slate-500">{country.code}</span>
										</button>
									))}
								</div>
							)}
						</div>
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
										? `Example: ${phonePatterns[form.country].example}`
										: t('ticket.field.phone_placeholder')
								}
								inputMode="numeric"
							/>
						</div>
					</div>
				</Field>

				<Field label={t('ticket.field.address')} error={errors.address}>
					<div className="relative">
						<span className="absolute right-4 top-3.5 text-slate-400">
							<FiMapPin />
						</span>
						<input
							name="address"
							value={form.address}
							onChange={handleChange}
							className={cn(inputClass("address"), "pr-11")}
							placeholder={t('ticket.field.address_placeholder')}
						/>
					</div>
				</Field>

				<div className="md:col-span-2">
					<Field label={t('ticket.field.message')} error={errors.message}>
						<div className="relative">
							<span className="absolute right-4 top-3.5 text-slate-400">
								<FiMessageSquare />
							</span>
							<textarea
								name="message"
								value={form.message}
								onChange={handleChange}
								className={cn(textareaClass("message"), "pr-11")}
								placeholder={t('ticket.field.message_placeholder')}
							/>
						</div>
					</Field>
				</div>

				<div className="md:col-span-2 pt-2 flex gap-3">
					<button
						type="submit"
						disabled={loading}
						className={cn(
							"flex-1 flex items-center justify-center gap-3 rounded-2xl bg-pro px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-pro/20 transition-all duration-300 hover:bg-pro-max hover:shadow-pro/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed",
							loading && "animate-pulse"
						)}
					>
						{loading ? (
							<>
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
								<span>{t('common.sending' as any)}</span>
							</>
						) : (
							<>
								<FiArrowUpRight className="text-lg" />
								<span>{t('ticket.form.submit')}</span>
							</>
						)}
					</button>
					
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="px-8 py-4 border border-slate-200 rounded-2xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
						>
							{t('common.cancel' as any)}
						</button>
					)}
				</div>
			</form>
		</div>
	);
}