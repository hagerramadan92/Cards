'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import {
	User,
	ShoppingBag,
	Heart,
	MapPin,
	HelpCircle,
	Plus,
	LayoutDashboard,
	List,
	FileText,
	Trash2,
	LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { createPortal } from "react-dom";

interface SideBarProps {
	active: string;
}

export default function SideBar({ active }: SideBarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { userImage, logout, fullName, authToken } = useAuth();
	const { t, language } = useLanguage();
	const [uploading, setUploading] = useState(false);

	const handleImageChange = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast.error(t('image.size_error'));
				return;
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error(t('image.type_error'));
				return;
			}

			if (!authToken) {
				toast.error(t('image.login_required'));
				return;
			}

			const API_URL = process.env.NEXT_PUBLIC_API_URL;
			if (!API_URL) {
				toast.error(t('image.api_unavailable'));
				return;
			}

			try {
				setUploading(true);

				const formData = new FormData();
				formData.append('image', file);

				const res = await fetch(`${API_URL}/auth/profile`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${authToken}`,
						"Accept-Language": language,
						Accept: "application/json",
					},
					body: formData,
				});

				const data = await res.json();

				if (!res.ok || !data?.status) {
					throw new Error(data?.message || t('image.upload_error'));
				}

				// Update localStorage
				const imageUrl = data?.data?.image || data?.data?.image_url;
				if (imageUrl) {
					localStorage.setItem('userImage', imageUrl);
					// Reload to update the image in context
					window.location.reload();
				}

				toast.success(t('image.upload_success'));
			} catch (error: any) {
				console.error('Error uploading image:', error);
				toast.error(error?.message || t('image.upload_general_error'));
			} finally {
				setUploading(false);
			}
		};
		input.click();
	};

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteReason, setDeleteReason] = useState("");

	const handleDeleteAccount = () => {
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteReason) {
			Swal.fire({
				icon: "warning",
				title: t('delete_account.select_reason'),
				text: t('delete_account.select_reason_text'),
			});
			return;
		}

		// TODO: Implement delete account API call with deleteReason
		setShowDeleteModal(false);
		Swal.fire(t('delete_account.success'), t('delete_account.success_message'), "success");
	};

	const handleLogout = async () => {
	  try {
		// setOpen(false);
		// logout?.();
		
	
		const token = localStorage.getItem("auth_token");
		
	
		await fetch("https://flashicard.renix4tech.com/api/v1/auth/logout", {
		  method: "POST",
		  headers: {
			"Accept-Language": "ar",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		  }
		}).catch(err => console.error("Logout API error:", err));
		
		// مسح البيانات المحلية
		localStorage.removeItem("favorites");
		localStorage.removeItem("auth_token");
		
		Swal.fire({
		  icon: "success",
		  title: t("logout"),
		  text: t("logout_success"),
		  timer: 1500,
		  showConfirmButton: false,
		});
	
		// التوجيه للصفحة الرئيسية
		setTimeout(() => {
		  window.location.href = "/";
		}, 1500);
		
	  } catch (err) {
		console.error("Logout error:", err);
		Swal.fire({
		  icon: "error",
		  title: t("error"),
		  text: t("logout_error"),
		  confirmButtonText: t("ok"),
		});
	  }
	};

	const items = [
		{
			key: "dashboard",
			label: t('sidebar.my_dashboard'),
			href: "/myAccount",
			icon: LayoutDashboard,
			action: null,
		},
		{
			key: "details",
			label: t('sidebar.my_details'),
			href: "/myAccount/details",
			icon: User,
			action: null,
		},
		{
			key: "orders",
			label: t('sidebar.my_orders'),
			href: "/myAccount/orders",
			icon: ShoppingBag,
			action: null,
		},
		{
			key: "coupons",
			label: t('sidebar.my_coupons'),
			href: "/myAccount/coupons",
			icon: List,
			action: null,
		},
		{
			key: "favorites",
			label: t('sidebar.my_favorites'),
			href: "/myAccount/favorites",
			icon: Heart,
			action: null,
		},
		{
			key: "status",
			label: t('sidebar.my_referral'),
			href: "/myAccount/status",
			icon: FileText,
			action: null,
		},
		{
			key: "help",
			label: t('sidebar.help_center'),
			href: "/myAccount/help",
			icon: HelpCircle,
			action: null,
		},
		{
			key: "delete-account",
			label: t('sidebar.delete_account'),
			href: "#",
			icon: Trash2,
			action: handleDeleteAccount,
		},
		{
			key: "log-out",
			label: t('sidebar.logout'),
			href: "#",
			icon: LogOut,
			action: handleLogout,
		},
	];

	/* ---------------- MOBILE TOGGLE ---------------- */
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Close mobile sidebar when pathname changes
	useEffect(() => {
		setIsMobileOpen(false);
	}, [pathname]);

	return (
		<>
			{/* Mobile Toggle Button (Visible only on small screens) */}
			<div className="lg:hidden fixed top-30 right-0 z-9999 mb-90">
				<button
					onClick={() => setIsMobileOpen(true)}
					className="flex items-center gap-2 px-3 py-2 bg-pro-max text-white rounded-l-xl shadow-lg hover:bg-pro-max/90 transition-all font-semibold"
				>
					<List className="w-5 h-5" />
					<span className="text-sm">{t('sidebar.menu')}</span>
				</button>
			</div>

			{/* Mobile Overlay */}
			<AnimatePresence>
				{isMobileOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsMobileOpen(false)}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-0 lg:hidden"
					/>
				)}
			</AnimatePresence>

			{/* Sidebar Container */}
			<aside
				className={`
					bg-white rounded-2xl shadow-sm border border-slate-200 p-4
					fixed inset-y-0 right-0 z-0 w-[280px] overflow-y-auto duration-300 ease-in-out transform
					lg:translate-x-0 lg:static lg:w-full lg:h-fit lg:overflow-visible
					${isMobileOpen ? "translate-x-0" : "translate-x-full"}
				`}
			>
				{/* Mobile Header (Close Button) */}
				<div className="lg:hidden flex items-center justify-between mt-[2.5rem] pb-4 border-b border-slate-100">
					<h3 className="font-bold text-lg text-slate-900">{t('sidebar.menu')}</h3>
					<button
						onClick={() => setIsMobileOpen(false)}
						className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
					>
						<FaTimes size={18} />
					</button>
				</div>

				{/* Profile Image Section */}
				<div className="flex flex-col items-center mb-2">
					<div className="relative group mb-4">
						{/* Image Container with Border and Shadow - Medium Size */}
						<div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 p-0.5 shadow-md group-hover:shadow-lg transition-all duration-300">
							<div className="relative w-full h-full rounded-full overflow-hidden bg-white">
								<div className="relative w-full h-full">
									<Image
										src={userImage || "/images/de_user.webp"}
										alt={t('profile.change_picture')}
										fill
										className="object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								</div>
								{/* Hover Overlay */}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-full pointer-events-none" />
							</div>
						</div>

						{/* Plus Button with Enhanced Styling */}
						<button
							onClick={handleImageChange}
							disabled={uploading}
							className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-pro-max text-white flex items-center justify-center shadow-xl border-2 border-white hover:bg-pro-max/90 hover:scale-110 active:scale-95 transition-all duration-200 z-0 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label={t('profile.change_image')}
							title={t('profile.change_image')}
						>
							{uploading ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<Plus
									size={14}
									className="transition-transform duration-200 group-hover/btn:rotate-90"
									strokeWidth={3}
								/>
							)}
						</button>

						{/* Tooltip on Hover */}
						<div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0">
							<div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
								{t('profile.image_tooltip')}
								<div className="absolute top-full start-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900"></div>
							</div>
						</div>
					</div>

					{/* Welcome Text */}
					<div className="text-center m-0 p-0">
						<p className="text-lg font-bold text-slate-900">{t('profile.welcome')}</p>
					</div>
				</div>

				<ul className="flex flex-col gap-1">
					{items.map((item) => {
						const isActive =
							pathname === item.href ||
							(item.key === "account" && pathname === "/myAccount") ||
							(item.key === "dashboard" && pathname === "/myAccount");

						const Icon = item.icon;
						const isDeleteOrLogout = item.key === "delete-account" || item.key === "log-out";
						const isLogout = item.key === "log-out";

						const content = (
							<>
								{/* Icon with orange background when active */}
								<div className={`p-1.25 rounded-lg
									${isActive ? "bg-orange-500 shadow-md" : ""}
									transition-all duration-300
								`}>
									<Icon
										size={18}
										className={`
											transition-colors
											${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}
										`}
									/>
								</div>

								{/* Label */}
								<span className={`flex-1 text-start cursor-pointer ${isActive ? "text-slate-900" : ""}`}>{item.label}</span>

								{/* Hover arrow */}
								<span
									className={`
										transition-all duration-300
										${isActive
											? "opacity-100 translate-x-0 text-pro-max"
											: "opacity-0 -translate-x-1 text-slate-400 group-hover:opacity-100 group-hover:translate-x-0"
										}
									`}
								>
									←
								</span>
							</>
						);

						return (
							<li key={item.key}>
								{item.action ? (
									<button
										onClick={item.action}
										className={`
											group relative flex items-center ${isDeleteOrLogout ? "gap-0" : "gap-1"} rounded-xl px-4 py-3 w-full
											text-[0.95rem] font-semibold transition-all duration-300
											focus:outline-none focus-visible:ring-2 focus-visible:ring-pro
											${isLogout
												? "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
												: "text-slate-600 hover:bg-red-50 hover:text-red-600"
											}
										`}
									>
										{content}
									</button>
								) : (
									<Link
										href={item.href}
										className={`
											group relative flex items-center gap-3 rounded-xl md:px-4 md:py-3 p-2
											text-[0.95rem] font-semibold transition-all duration-300
											focus:outline-none focus-visible:ring-2 focus-visible:ring-pro
											${isActive
												? "bg-white text-slate-900 shadow-sm"
												: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
											}
										`}
									>
										{content}
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			</aside>

			{/* Delete Account Modal */}
			<DeleteAccountModal
				isOpen={showDeleteModal}
				onClose={() => {
					setShowDeleteModal(false);
					setDeleteReason("");
				}}
				onConfirm={handleConfirmDelete}
				reason={deleteReason}
				onReasonChange={setDeleteReason}
			/>
		</>
	);
}

function DeleteAccountModal({
	isOpen,
	onClose,
	onConfirm,
	reason,
	onReasonChange,
}: {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	reason: string;
	onReasonChange: (reason: string) => void;
}) {
	const { t } = useLanguage();
	
	const reasons = [
		t('delete_reason.never_used'),
		t('delete_reason.no_time'),
		t('delete_reason.changing_email'),
		t('delete_reason.security_concern'),
		t('delete_reason.other'),
	];

	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const modalContent = (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm"
						style={{ zIndex: 999999999 }}
					/>
					{/* Modal */}
					<div className="fixed inset-0 flex items-center justify-center p-4" dir="rtl" style={{ zIndex: 999999999 }}>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
							style={{ marginTop: '10%' }}
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header */}
							<div className="p-6 border-b border-slate-200">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-bold text-slate-900">{t('delete_account.title')}</h2>
									<button
										onClick={onClose}
										className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
									>
										<FaTimes className="text-slate-600" size={14} />
									</button>
								</div>
								<p className="text-base text-slate-700 mb-2">{t('delete_account.sad_message')}</p>
								<p className="text-sm text-slate-600">
									{t('delete_account.warning')}
								</p>
							</div>

							{/* Content */}
							<div className="p-6">
								<div className="space-y-3">
									{reasons.map((r) => (
										<label
											key={r}
											className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
										>
											<input
												type="radio"
												name="deleteReason"
												value={r}
												checked={reason === r}
												onChange={(e) => onReasonChange(e.target.value)}
												className="mt-0.5 w-4 h-4 text-pro-max focus:ring-pro-max focus:ring-offset-0 cursor-pointer"
											/>
											<span className="text-sm text-slate-700 flex-1">{r}</span>
										</label>
									))}
								</div>
							</div>

							{/* Footer */}
							<div className="p-6 border-t border-slate-200 flex gap-3">
								<button
									onClick={onClose}
									className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
								>
									{t('delete_account.cancel')}
								</button>
								<button
									onClick={onConfirm}
									disabled={!reason}
									className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{t('delete_account.confirm')}
								</button>
							</div>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);

	if (typeof window === 'undefined') return null;

	return mounted ? createPortal(modalContent, document.body) : null;
}