"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiKey, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import ButtonComponent from "../../../components/ButtonComponent";

import { useLanguage } from "@/src/context/LanguageContext";

export default function ForgetPasswordPage() {
	const { t, language } = useLanguage();
	const router = useRouter();

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const [email, setEmail] = useState("");
	const [codeSent, setCodeSent] = useState(false);

	const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));

	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

	const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

	const fieldBase = "w-full rounded-2xl border bg-white px-4 py-3 text-[15px] font-semibold outline-none transition " +
		"placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200";

	const fieldOk = "border-slate-200 focus:border-pro focus:ring-pro/10";
	const finalCode = otpDigits.join("");
	const canVerify = useMemo(() => finalCode.length === 6 && !loading, [finalCode, loading]);

	const setMessage = (type: "error" | "success" | "info", text: string) => setMsg({ type, text });

	const handleSendCode = async () => {
		if (!email.trim()) return setMessage("error", t('please_enter_email'));

		try {
			setLoading(true);
			setMsg(null);

			const res = await fetch(`${API_URL}/auth/send-otp`, {
				method: "POST",
				headers: { 
					"Content-Type": "application/json", 
					Accept: "application/json",
					"Accept-Language": language
				},

				body: JSON.stringify({ email }),
			});

			const data = await res.json();

			if (res.ok) {
				setMessage("success", t('otp_sent_success'));
				setCodeSent(true);
				setOtpDigits(Array(6).fill(""));
				// focus first digit
				setTimeout(() => otpRefs.current?.[0]?.focus(), 50);
			} else {
				setMessage("error", data.message || t('send_error'));
			}
		} catch {
			setMessage("error", t('server_error'));
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmCode = async () => {
		if (!API_URL) return setMessage("error", "NEXT_PUBLIC_API_URL غير موجود");

		if (finalCode.length !== 6) {
			setMessage("error", t('otp_confirm_error'));
			return;
		}

		try {
			setLoading(true);
			setMsg(null);

			const res = await fetch(`${API_URL}/auth/verify-otp`, {
				method: "POST",
				headers: { 
					"Content-Type": "application/json", 
					Accept: "application/json",
					"Accept-Language": language
				},
 
				body: JSON.stringify({ email, otp: finalCode }),
			});

			const data = await res.json();

			if (!res.ok) {
				setMessage("error", data.message || t('otp_wrong'));
				return;
			}

			setMessage("success", t('otp_verify_success'));
			router.push(
				`/login/resetpassword?email=${encodeURIComponent(email)}&code=${encodeURIComponent(finalCode)}`
			);
		} catch {
			setMessage("error", t('server_error'));
		} finally {
			setLoading(false);
		}
	};

	const handleOtpChange = (index: number, raw: string) => {
		const v = raw.replace(/\D/g, "").slice(0, 1); // digit only
		setOtpDigits((prev) => {
			const next = [...prev];
			next[index] = v;
			return next;
		});

		if (v && index < 5) otpRefs.current?.[index + 1]?.focus();
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace") {
			if (otpDigits[index]) {
				// clear current
				setOtpDigits((prev) => {
					const next = [...prev];
					next[index] = "";
					return next;
				});
			} else if (index > 0) {
				otpRefs.current?.[index - 1]?.focus();
			}
		}

		if (e.key === "ArrowLeft" && index < 5) otpRefs.current?.[index + 1]?.focus();
		if (e.key === "ArrowRight" && index > 0) otpRefs.current?.[index - 1]?.focus();
	};

	const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
		if (!pasted) return;

		e.preventDefault();
		const next = Array(6).fill("").map((_, i) => pasted[i] || "");
		setOtpDigits(next);

		const focusIndex = Math.min(pasted.length, 6) - 1;
		setTimeout(() => otpRefs.current?.[Math.max(0, focusIndex)]?.focus(), 50);
	};

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
						<h1 className="text-xl text-center md:text-2xl font-extrabold leading-snug">
							{t('forget_password_title')}
						</h1>
						<p className="text-center text-white/80 mt-2 text-sm font-semibold">
							{!codeSent ? t('enter_email_to_send_otp') : t('enter_otp_6_digits')}
						</p>
					</div>

					<div className="p-7">
						{/* Message */}
						<AnimatePresence>
							{msg && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
									className={[
										"mb-4 rounded-2xl border px-4 py-3 text-sm font-bold",
										msg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "",
										msg.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "",
										msg.type === "info" ? "border-slate-200 bg-slate-50 text-slate-700" : "",
									].join(" ")}
								>
									{msg.text}
								</motion.div>
							)}
						</AnimatePresence>

						{!codeSent ? (
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">
										{t('email')}
									</label>

									<div className="relative">
										<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
											<FiMail />
										</span>

										<input
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="example@email.com"
											className={[fieldBase, "pr-11", fieldOk].join(" ")}
										/>
									</div>
								</div>


								<div className={`${loading ? "opacity-80 pointer-events-none" : ""}`}>
									<ButtonComponent
										title={loading ? t('sending') : t('send_message')}
										onClick={handleSendCode as any}
									/>
								</div>

								<div className="flex items-center justify-between">
									<Link
										href="/login"
										className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-700 hover:text-slate-900 transition"
									>
										<FiArrowRight />
										{t('back_to_login')}
									</Link>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
									<div className="min-w-0">
										<p className="text-xs font-bold text-slate-500">{t('verification_on_email')}</p>
										<p className="text-sm font-extrabold text-slate-900 truncate">{email}</p>
									</div>
									<button
										type="button"
										onClick={() => {
											setCodeSent(false);
											setOtpDigits(Array(6).fill(""));
											setMsg(null);
										}}
										className="text-xs font-extrabold text-pro hover:opacity-80 transition"
									>
										{t('edit')}
									</button>
								</div>

								<div>
									<label className="block text-sm font-extrabold text-slate-800 mb-2">
										{t('otp_label')}
									</label>

									<div className="flex justify-center gap-2" dir="ltr">
										{otpDigits.map((digit, index) => (
											<motion.input
												key={index}
												ref={(el) => {
													otpRefs.current[index] = el;
												}}
												initial={{ opacity: 0, y: 6 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.03 }}
												inputMode="numeric"
												type="text"
												maxLength={1}
												value={digit}
												onChange={(e) => handleOtpChange(index, e.target.value)}
												onKeyDown={(e) => handleOtpKeyDown(index, e)}
												onPaste={handleOtpPaste}
												className={[
													"w-12 h-12 rounded-2xl text-center text-lg font-extrabold outline-none transition",
													"border bg-white focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200",
													digit ? "border-slate-300 focus:border-pro focus:ring-pro/10" : "border-slate-200 focus:border-pro focus:ring-pro/10",
												].join(" ")}
											/>
										))}
									</div>

									<div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
										<span className="inline-flex items-center gap-1">
											<FiKey /> {t('enter_6_digits')}
										</span>
										<button
											type="button"
											onClick={handleSendCode}
											disabled={loading}
											className="text-pro hover:opacity-80 transition disabled:opacity-60"
										>
											{t('resend_otp')}
										</button>
									</div>
								</div>

								<button
									onClick={handleConfirmCode}
									disabled={!canVerify}
									className={[
										"w-full rounded-2xl py-3 font-extrabold text-white transition",
										"bg-slate-900 hover:opacity-95",
										"disabled:opacity-60 disabled:cursor-not-allowed",
									].join(" ")}
								>
									{loading ? t('verifying') : t('confirm_otp')}
								</button>

								<div className="flex items-center justify-between">
									<button
										type="button"
										onClick={() => {
											setCodeSent(false);
											setOtpDigits(Array(6).fill(""));
											setMsg(null);
										}}
										className="text-sm font-extrabold text-slate-700 hover:text-slate-900 transition"
									>
										{t('back')}
									</button>

									<Link
										href="/login"
										className="text-sm font-extrabold text-pro hover:opacity-80 transition"
									>
										{t('login_short')}
									</Link>
								</div>
							</div>
						)}
					</div>
				</div>

				<p className="text-center text-xs text-slate-500 font-semibold mt-4">
					{t('otp_spam_note')}
				</p>
			</motion.div>
		</div>
	);
}
