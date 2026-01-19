"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useLanguage } from "@/src/context/LanguageContext";

export default function ChangePassword() {
	const { t, language } = useLanguage();
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!oldPassword || !newPassword || !confirmPassword) {
			toast.error(t("all_fields_required"));
			return;
		}

		if (newPassword.length < 8) {
			toast.error(t("password_min_length"));
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error(t("passwords_not_match"));
			return;
		}

		if (oldPassword === newPassword) {
			toast.error(t("new_password_diff"));
			return;
		}

		setLoading(true);

		try {
			const token = localStorage.getItem("auth_token");
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
						"Accept-Language": language,
						Accept: "application/json"
					},
					body: JSON.stringify({
						old_password: oldPassword,
						new_password: newPassword,
						new_password_confirmation: confirmPassword,
					}),
				}
			);

			const data = await res.json().catch(() => null);

			if (res.ok && data?.status) {
				toast.success(data?.message || t("change_password_success"));
				setOldPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				toast.error(data?.message || t("change_password_error"));
			}
		} catch (err) {
			console.error(err);
			toast.error(t("send_error"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div dir="rtl" className="space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h4 className="text-base md:text-lg font-extrabold text-slate-900">
						{t("change_password_title")}
					</h4>
					<p className="mt-1 text-sm text-slate-500">
						{t("change_password_subtitle")}
					</p>
				</div>

				<span className="hidden md:inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
					{t("account_security")}
				</span>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-4">
				{/* Old password */}
				<PasswordField
					label={t("old_password_label")}
					placeholder={t("old_password_placeholder")}
					value={oldPassword}
					onChange={setOldPassword}
					show={showOld}
					onToggle={() => setShowOld((v) => !v)}
					hideText={t("hide_password")}
					showText={t("show_password")}
				/>

				{/* New password */}
				<PasswordField
					label={t("new_password")}
					placeholder={t("new_password_placeholder")}
					value={newPassword}
					onChange={setNewPassword}
					show={showNew}
					onToggle={() => setShowNew((v) => !v)}
					hideText={t("hide_password")}
					showText={t("show_password")}
				/>

				{/* Confirm */}
				<PasswordField
					label={t("confirm_password_label")}
					placeholder={t("confirm_password_placeholder")}
					value={confirmPassword}
					onChange={setConfirmPassword}
					show={showConfirm}
					onToggle={() => setShowConfirm((v) => !v)}
					hideText={t("hide_password")}
					showText={t("show_password")}
				/>

				{/* actions */}
				<div className="flex flex-col md:flex-row md:items-center gap-3 pt-2">
					<button
						type="submit"
						disabled={loading}
						className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition
              ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-pro hover:opacity-95 active:scale-[0.99]"}
            `}
					>
						{loading ? (
							<>
								<span className="inline-block h-5 w-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
								{t("changing_password")}
							</>
						) : (
							t("change_password_title")
						)}
					</button>

					<p className="text-xs text-slate-500">
						{t("password_min_8")}
					</p>
				</div>
			</form>
		</div>
	);
}

function PasswordField({
	label,
	placeholder,
	value,
	onChange,
	show,
	onToggle,
	hideText,
	showText,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	show: boolean;
	onToggle: () => void;
	hideText: string;
	showText: string;
}) {
	return (
		<div className="space-y-2">
			<label className="text-sm font-extrabold text-slate-800">{label}</label>

			<div className="relative">
				<input
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900
                     placeholder:text-slate-400 outline-none transition
                     focus:border-pro focus:ring-2 focus:ring-pro/20  duration-200"
				/>

				<button
					type="button"
					onClick={onToggle}
					aria-label={show ? hideText : showText}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
				>
					{show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
				</button>
			</div>
		</div>
	);
}
