"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import Link from "next/link";
import LoginWithGoogle from "@/components/loginWithGoogle";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiUser, FiChevronDown } from "react-icons/fi";
import ButtonComponent from "../../components/ButtonComponent";
import { useLanguage } from "@/src/context/LanguageContext";

export default function SignupPage() {
	const { t, language } = useLanguage();
	const router = useRouter();
	const { login } = useAuth();
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [phoneCountry, setPhoneCountry] = useState("EG");
	const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
	const phoneCountryRef = useRef<HTMLDivElement>(null);

	// Phone country patterns
	const phonePatterns: Record<string, { pattern: RegExp; example: string; message: string; flag: string; name: string; code: string }> = {
		EG: {
			pattern: /^01[0-9]{9}$/,
			example: "01012345678",
			message: t('invalid_phone'),
			flag: "eg",
			name: t('egypt'),
			code: "+20",
		},
		SA: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('invalid_phone'),
			flag: "sa",
			name: t('saudi_arabia'),
			code: "+966",
		},
		AE: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('invalid_phone'),
			flag: "ae",
			name: t('uae'),
			code: "+971",
		},
		KW: {
			pattern: /^[569][0-9]{7}$/,
			example: "51234567",
			message: t('invalid_phone'),
			flag: "kw",
			name: t('kuwait'),
			code: "+965",
		},
		QA: {
			pattern: /^[3-7][0-9]{7}$/,
			example: "33123456",
			message: t('invalid_phone'),
			flag: "qa",
			name: t('qatar'),
			code: "+974",
		},
		BH: {
			pattern: /^[3-9][0-9]{7}$/,
			example: "36123456",
			message: t('invalid_phone'),
			flag: "bh",
			name: t('bahrain'),
			code: "+973",
		},
		OM: {
			pattern: /^[79][0-9]{8}$/,
			example: "912345678",
			message: t('invalid_phone'),
			flag: "om",
			name: t('oman'),
			code: "+968",
		},
		JO: {
			pattern: /^07[789][0-9]{7}$/,
			example: "0791234567",
			message: t('invalid_phone'),
			flag: "jo",
			name: t('jordan'),
			code: "+962",
		},
		LB: {
			pattern: /^[0-9]{8}$/,
			example: "12345678",
			message: t('invalid_phone'),
			flag: "lb",
			name: t('lebanon'),
			code: "+961",
		},
		IQ: {
			pattern: /^07[0-9]{9}$/,
			example: "07912345678",
			message: t('invalid_phone'),
			flag: "iq",
			name: t('iraq'),
			code: "+964",
		},
		YE: {
			pattern: /^7[0-9]{8}$/,
			example: "712345678",
			message: t('invalid_phone'),
			flag: "ye",
			name: t('yemen'),
			code: "+967",
		},
		SY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('invalid_phone'),
			flag: "sy",
			name: t('syria'),
			code: "+963",
		},
		PS: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('invalid_phone'),
			flag: "ps",
			name: t('palestine'),
			code: "+970",
		},
		MA: {
			pattern: /^06[0-9]{8}$/,
			example: "0612345678",
			message: t('invalid_phone'),
			flag: "ma",
			name: t('morocco'),
			code: "+212",
		},
		DZ: {
			pattern: /^05[0-9]{8}$/,
			example: "0512345678",
			message: t('invalid_phone'),
			flag: "dz",
			name: t('algeria'),
			code: "+213",
		},
		TN: {
			pattern: /^[2-9][0-9]{7}$/,
			example: "21234567",
			message: t('invalid_phone'),
			flag: "tn",
			name: t('tunisia'),
			code: "+216",
		},
		LY: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('invalid_phone'),
			flag: "ly",
			name: t('libya'),
			code: "+218",
		},
		SD: {
			pattern: /^9[0-9]{8}$/,
			example: "912345678",
			message: t('invalid_phone'),
			flag: "sd",
			name: t('sudan'),
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

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [errors, setErrors] = useState<{
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		password?: string;
		confirmPassword?: string;
		form?: string;
	}>({});

	const [pending, setPending] = useState(false);

	const canSubmit = useMemo(() => {
		return (
			firstName.trim() &&
			lastName.trim() &&
			email.trim() &&
			phone.trim() &&
			password.trim() &&
			confirmPassword.trim() &&
			!pending
		);
	}, [firstName, lastName, email, phone, password, confirmPassword, pending]);

	const validate = () => {
		const newErrors: typeof errors = {};

		if (!firstName.trim()) newErrors.firstName = t('first_name_required');
		if (!lastName.trim()) newErrors.lastName = t('last_name_required');

		if (!email.trim()) newErrors.email = t('email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			newErrors.email = t('email_invalid');

		if (!phone.trim()) {
			newErrors.phone = t('phone_required');
		} else if (phoneCountry && phonePatterns[phoneCountry]) {
			const pattern = phonePatterns[phoneCountry];
			if (!pattern.pattern.test(phone)) {
				newErrors.phone = pattern.message;
			}
		} else if (!/^\d+$/.test(phone)) {
			newErrors.phone = t('phone_digits_only');
		}

		if (!password.trim()) newErrors.password = t('password_required');
		else if (password.length < 8) newErrors.password = t('password_min_length');

		if (!confirmPassword.trim()) newErrors.confirmPassword = t('confirm_password_required');
		else if (confirmPassword !== password) newErrors.confirmPassword = t('passwords_not_match');

		return newErrors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!API_URL) {
			Swal.fire({ icon: "error", title: t('error'), text: "NEXT_PUBLIC_API_URL missing", confirmButtonText: t('close') });
			return;
		}

		setErrors({});
		const newErrors = validate();

		if (Object.keys(newErrors).length) {
			setErrors(newErrors);
			Swal.fire({ icon: "error", title: t('error'), text: t('please_check_data'), confirmButtonText: t('close') });
			return;
		}

		try {
			setPending(true);

			const res = await fetch(`${API_URL}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" ,  "Accept-Language": language },
				body: JSON.stringify({
					name: `${firstName} ${lastName}`,
					email,
					phone: `${phonePatterns[phoneCountry].code}${phone}`,
					password,
					password_confirmation: confirmPassword,
				}),
			});

			const data = await res.json();

			if (res.ok && data.status !== false) {
				const token = data.data?.token;

				if (token) {
					login(
						token,
						firstName,
						email,
						data?.data?.user?.image || "",
						`${firstName} ${lastName}`
					);
				}

				Swal.fire({ icon: "success", title: t('account_created_success'), timer: 1400, showConfirmButton: false });
				router.push("/");
			} else {
				const msg = data.message || t('signup_error');
				setErrors((p) => ({ ...p, form: msg }));

				if (data.errors) {
					const apiErrors: any = {};
					Object.keys(data.errors).forEach((k) => (apiErrors[k] = data.errors[k][0]));
					setErrors((p) => ({ ...p, ...apiErrors }));
				}

				Swal.fire({ icon: "error", title: t('error'), text: msg, confirmButtonText: t('close') });
			}
		} catch (err) {
			setErrors((p) => ({ ...p, form: t('server_error') }));
			Swal.fire({ icon: "error", title: t('error'), text: t('server_error'), confirmButtonText: t('close') });
		} finally {
			setPending(false);
		}
	};

	const fieldBase =
		"w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

	const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
	const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 flex items-center justify-center" dir="rtl">
			<div
				className="absolute inset-0 opacity-15"
				style={{
					backgroundImage:
						"linear-gradient(rgba(79,70,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.12) 1px, transparent 1px)",
					backgroundSize: "12px 12px",
					backgroundPosition: "-1px -1px",
				}}
			/>

			<motion.div
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="w-full relative z-[10] max-w-xl"
			>
				<div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
					{/* Header */}
					<div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">{t('create_new_account')}</h1>
					</div>

					<div className="p-7">
						{/* form error */}
						{errors.form && (
							<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
								{errors.form}
							</div>
						)}

						<form className="space-y-4" onSubmit={handleSubmit}>
							{/* First + Last */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('first_name')}</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiUser />
										</span>
										<input
											value={firstName}
											onChange={(e) => {
												setFirstName(e.target.value);
												if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
											}}
											placeholder={t('first_name_hint')}
											className={[fieldBase, "pr-11", errors.firstName ? fieldBad : fieldOk].join(" ")}
										/>
									</div>
									{errors.firstName && <p className="mt-2 text-xs font-bold text-rose-600">{errors.firstName}</p>}
								</div>

								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('last_name')}</label>
									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiUser />
										</span>
										<input
											value={lastName}
											onChange={(e) => {
												setLastName(e.target.value);
												if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
											}}
											placeholder={t('last_name_hint')}
											className={[fieldBase, "pr-11", errors.lastName ? fieldBad : fieldOk].join(" ")}
										/>
									</div>
									{errors.lastName && <p className="mt-2 text-xs font-bold text-rose-600">{errors.lastName}</p>}
								</div>
							</div>

							{/* Email */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('email')}</label>
								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiMail />
									</span>
									<input
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) setErrors((p) => ({ ...p, email: "" }));
										}}
										placeholder={t('email_or_phone_placeholder')}
										className={[fieldBase, "pr-11", errors.email ? fieldBad : fieldOk].join(" ")}
									/>
								</div>
								{errors.email && <p className="mt-2 text-xs font-bold text-rose-600">{errors.email}</p>}
							</div>

							{/* Phone */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('phone_number')}</label>
								<div className="relative flex" dir="ltr">
									{/* Country Dropdown - Left side */}
									<div className="relative flex-shrink-0 w-20 " ref={phoneCountryRef}>
										{/* Selected Country Button */}
										<button
											type="button"
											onClick={() => setPhoneCountryOpen(!phoneCountryOpen)}
											className={cn(
												"w-full rounded-l-2xl h-full border border-slate-200 bg-white px-2 py-3 text-sm font-semibold text-slate-900 outline-none transition border-r-0 cursor-pointer hover:bg-slate-50 focus:border-pro focus:ring-2 focus:ring-pro/20 flex items-center justify-between",
												errors.phone ? "border-red-400" : ""
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
												<span className="text-xs">{t('select_country')}</span>
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
															if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
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
											value={phone}
											onChange={(e) => {
												setPhone(e.target.value);
												if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
											}}
											placeholder={
												phoneCountry && phonePatterns[phoneCountry]
													? ` ${phonePatterns[phoneCountry].example}`
													: t('enter_phone_number')
											}
											inputMode="numeric"
											className={cn(
												fieldBase,
												"rounded-l-none rounded-r-2xl",
												errors.phone ? fieldBad : fieldOk
											)}
										/>
									</div>
								</div>
								{errors.phone && <p className="mt-2 text-xs font-bold text-rose-600">{errors.phone}</p>}
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('password')}</label>
								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiLock />
									</span>
									<input
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											if (errors.password) setErrors((p) => ({ ...p, password: "" }));
										}}
										placeholder={t('password_placeholder')}
										className={[fieldBase, "pr-11 pl-12", errors.password ? fieldBad : fieldOk].join(" ")}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((p) => !p)}
										className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
										aria-label={showPassword ? t('hide_password') : t('show_password')}
									>
										{showPassword ? <BiSolidShow size={22} /> : <BiSolidHide size={22} />}
									</button>
								</div>
								{errors.password && <p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>}
							</div>

							{/* Confirm */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">{t('confirm_password')}</label>
								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiLock />
									</span>
									<input
										type={showConfirm ? "text" : "password"}
										value={confirmPassword}
										onChange={(e) => {
											setConfirmPassword(e.target.value);
											if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
										}}
										placeholder={t('password_placeholder')}
										className={[fieldBase, "pr-11 pl-12", errors.confirmPassword ? fieldBad : fieldOk].join(" ")}
									/>
									<button
										type="button"
										onClick={() => setShowConfirm((p) => !p)}
										className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
										aria-label={showConfirm ? t('hide_password') : t('show_password')}
									>
										{showConfirm ? <BiSolidShow size={22} /> : <BiSolidHide size={22} />}
									</button>
								</div>
								{errors.confirmPassword && (
									<p className="mt-2 text-xs font-bold text-rose-600">{errors.confirmPassword}</p>
								)}
							</div>

							{/* Submit */}

							<div className="pt-2">
								<div className={`${pending ? "opacity-80 pointer-events-none" : ""}`}>
									<ButtonComponent
										title={pending ? t('creating_account') : t('signup_short')}
										onClick={handleSubmit as any}
									/>
								</div>
							</div>

							{/* Login link */}
							<div className="text-center pt-2">
								<span className="text-sm font-semibold text-slate-600">{t('already_have_account')} </span>
								<Link href="/login" className="text-sm font-extrabold text-pro hover:opacity-80 transition">
									{t('login_short')}
								</Link>
							</div>
						</form>
					</div>
				</div>

				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					{t('signup_agreement_note')}
				</p>
			</motion.div>
		</div>
	);
}
