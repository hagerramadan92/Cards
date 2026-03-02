"use client";

import React, { useEffect, useMemo, useState } from "react";
import ButtonComponent from "@/components/ButtonComponent";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BiSolidHide, BiSolidShow } from "react-icons/bi";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import LoginWithGoogle from "@/components/loginWithGoogle";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import Logo from "../../components/Logo";
import LoginWithEmail from "@/components/LoginEmail/LoginWithEmail";
import LoginWithFaceBook from "@/components/login-facebook/LoginWithFaceBook";
import LoginWithX from "@/components/login-facebook/LoginWithX";
import { useLanguage } from "@/src/context/LanguageContext";

export default function Page() {
	const { t, language } = useLanguage();
	const [email, setEmail] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);

	const router = useRouter();
	const { data: session, status } = useSession();
	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const { setAuthFromApi } = useAuth();

	const validateInput = (input: string) => {
		const trimmed = input.trim();
		if (!trimmed) return t('enter_email_or_phone');

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (emailRegex.test(trimmed)) return "";

		const phoneRegex = /^(?:\+?20|0)?1[0-9]{9}$/;
		if (phoneRegex.test(trimmed)) return "";

		return t('enter_valid_email_or_phone');
	};

	const canSubmit = useMemo(() => {
		return email.trim().length > 0 && password.trim().length > 0 && !pending;
	}, [email, password, pending]);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (pending) return;

		setErrors({});

		const emailError = validateInput(email);
		if (emailError) {
			setErrors((p) => ({ ...p, email: emailError }));
			Swal.fire({ icon: "error", title: t('error'), text: emailError, confirmButtonText: t('close') });
			return;
		}

		if (!password.trim()) {
			setErrors((p) => ({ ...p, password: t('password_required') }));
			Swal.fire({ icon: "error", title: t('error'), text: t('password_required'), confirmButtonText: t('close') });
			return;
		}

		try {
			setPending(true);

			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Language": language },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (res.ok && data.status !== false) {
				const token = data.data?.token;
				const userData = {
					name: data.data.user.name,
					email: data.data.user.email,
					image: data.data.user.image,
					fullName: data.data.user.name,
				};

				if (token) {
					setAuthFromApi({
						token,
						name: userData.name,
						email: userData.email,
						image: userData.image,
						fullName: userData.fullName,
						message: data.message,
					});
				}

				router.push("/");
			} else {
				const msg = data.message || t('login_error');
				setErrors((p) => ({ ...p, form: msg }));
				toast.error(msg);
			}
		} catch {
			const errorMsg = t('server_error');
			setErrors((p) => ({ ...p, form: errorMsg }));
			toast.error(errorMsg);
		} finally {
			setPending(false);
		}
	};

	useEffect(() => {
		if (status === "authenticated" && session?.user) {
			localStorage.setItem("userEmail", session.user.email || "");
			localStorage.setItem("userName", session.user.name || "");
			localStorage.setItem("userImage", session.user.image || "");
			router.push("/");
		}
	}, [status, session, router]);

	const fieldBase =
		"w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

	const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
	const fieldBad = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 flex items-center justify-center" dir="rtl">
			<div className='absolute  inset-0 opacity-15' style={{ backgroundImage: 'linear-gradient(rgba(79,70,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.12) 1px, transparent 1px)', backgroundSize: '12px 12px', backgroundPosition: '-1px -1px' }} />
			<Logo className=" absolute top-2 right-[30px] " />
			<motion.div
				initial={{ opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="w-full relative z-[10] max-w-xl"
			>
				{/* Card */}
				<div className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.08)] overflow-hidden">
					{/* Header */}
					<div className="p-7 pb-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white">
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">
							{t('login')}
						</h1>
					</div>

					<div className="p-7">
						{/* form error */}
						{errors.form && (
							<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
								{errors.form}
							</div>
						)}

						<form className="space-y-4" onSubmit={handleSubmit}>
							{/* Email / Phone */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">
									{t('email_or_phone')}
								</label>

								<div className="relative">
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
										<FiMail />
									</span>

									<input
										type="text"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) setErrors((p) => ({ ...p, email: "" }));
										}}
										placeholder={t('email_or_phone_placeholder')}
										className={[
											fieldBase,
											"pr-11",
											errors.email ? fieldBad : fieldOk,
										].join(" ")}
									/>
								</div>

								{errors.email && (
									<p className="mt-2 text-xs font-bold text-rose-600">{errors.email}</p>
								)}
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-extrabold text-slate-800 mb-2">
									{t('password')}
								</label>

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
										className={[
											fieldBase,
											"pr-11 pl-12",
											errors.password ? fieldBad : fieldOk,
										].join(" ")}
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

								{errors.password && (
									<p className="mt-2 text-xs font-bold text-rose-600">{errors.password}</p>
								)}
							</div>

							{/* Links row */}
							<div className="flex items-center justify-between pt-1">
								<Link href="/login/forgetPassword" className="text-sm font-extrabold text-pro hover:opacity-80 transition">
									{t('forgot_password')}
								</Link>

								<Link href="/signup" className="text-sm font-extrabold text-slate-700 hover:text-slate-900 transition">
									{t('no_account_yet')}
								</Link>
							</div>

							{/* Submit */}
							<div className="pt-2">
								<div className={`${pending ? "opacity-80 pointer-events-none" : ""}`}>
									<ButtonComponent
										type="submit"
										title={pending ? t('logging_in') : t('login_short')}
										onClick={handleSubmit as any}
									/>
								</div>

							</div>
						</form>

						{/* Divider */}
						<div className="my-6 flex items-center gap-3">
							<div className="h-px flex-1 bg-slate-200" />
							<span className="text-xs font-extrabold text-slate-500">{t('or')}</span>
							<div className="h-px flex-1 bg-slate-200" />
						</div>
						<div className=" ">
							{/* Google */}
							<LoginWithGoogle />
							{/* <LoginWithEmail /> */}
							{/* <LoginWithFaceBook /> */}
							{/* <LoginWithX /> */}
						</div>

					</div>
				</div>

				{/* Footer note */}
				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					{t('login_agreement_note')}
				</p>
			</motion.div>
		</div>
	);
}
