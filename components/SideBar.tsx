"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/src/context/AuthContext";
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
import { useState } from "react";
import toast from "react-hot-toast";

interface SideBarProps {
	active: string;
}

export default function SideBar({ active }: SideBarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { userImage, logout, fullName, authToken } = useAuth();
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
				toast.error("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت");
				return;
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error("الرجاء اختيار ملف صورة صحيح");
				return;
			}

			if (!authToken) {
				toast.error("يجب تسجيل الدخول أولاً");
				return;
			}

			const API_URL = process.env.NEXT_PUBLIC_API_URL;
			if (!API_URL) {
				toast.error("API غير متوفر");
				return;
			}

			try {
				setUploading(true);

				const formData = new FormData();
				formData.append('image', file);

				const res = await fetch(`${API_URL}/auth/profile/update-image`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
					body: formData,
				});

				const data = await res.json();

				if (!res.ok || !data?.status) {
					throw new Error(data?.message || 'فشل رفع الصورة');
				}

				// Update localStorage
				const imageUrl = data?.data?.image || data?.data?.image_url;
				if (imageUrl) {
					localStorage.setItem('userImage', imageUrl);
					// Reload to update the image in context
					window.location.reload();
				}

				toast.success('تم تحديث الصورة الشخصية بنجاح');
			} catch (error: any) {
				console.error('Error uploading image:', error);
				toast.error(error?.message || 'حدث خطأ أثناء رفع الصورة');
			} finally {
				setUploading(false);
			}
		};
		input.click();
	};

	const handleDeleteAccount = async () => {
		const result = await Swal.fire({
			title: "هل أنت متأكد؟",
			text: "سيتم حذف حسابك بشكل دائم ولا يمكن التراجع عن هذا الإجراء",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "نعم، احذف الحساب",
			cancelButtonText: "إلغاء",
		});

		if (result.isConfirmed) {
			// TODO: Implement delete account API call
			Swal.fire("تم الحذف", "تم حذف حسابك بنجاح", "success");
		}
	};

	const handleLogout = async () => {
		const result = await Swal.fire({
			title: "تسجيل الخروج",
			text: "هل أنت متأكد من تسجيل الخروج؟",
			icon: "question",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "نعم، سجل الخروج",
			cancelButtonText: "إلغاء",
		});

		if (result.isConfirmed) {
			logout();
		}
	};

	const items = [
		{
			key: "dashboard",
			label: "لوحة التحكم الخاصة بي",
			href: "/myAccount",
			icon: LayoutDashboard,
			action: null,
		},
		{
			key: "details",
			label: "التفاصيل الخاصة بي",
			href: "/myAccount/details",
			icon: User,
			action: null,
		},
		{
			key: "orders",
			label: "طلباتي",
			href: "/myAccount/orders",
			icon: ShoppingBag,
			action: null,
		},
		{
			key: "categories",
			label: "قسائمي",
			href: "/myAccount/categories",
			icon: List,
			action: null,
		},
		{
			key: "favorites",
			label: "منتجاتي المفضلة",
			href: "/myAccount/favorites",
			icon: Heart,
			action: null,
		},
		{
			key: "status",
			label: "الاحالة الخاصة بي",
			href: "/myAccount/status",
			icon: FileText,
			action: null,
		},
		{
			key: "help",
			label: "مركز المساعدة",
			href: "/myAccount/help",
			icon: HelpCircle,
			action: null,
		},
		{
			key: "delete-account",
			label: "حذف الحساب",
			href: "#",
			icon: Trash2,
			action: handleDeleteAccount,
		},
		{
			key: "log-out",
			label: "تسجيل خروج",
			href: "#",
			icon: LogOut,
			action: handleLogout,
		},
	];

	return (
		<aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
			{/* Profile Image Section */}
			<div className="flex flex-col items-center mb-2">
				<div className="relative group mb-4">
					{/* Image Container with Border and Shadow - Medium Size */}
					<div className="relative w-[100px] h-[100px] rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 p-0.5 shadow-md group-hover:shadow-lg transition-all duration-300">
						<div className="relative w-full h-full rounded-full overflow-hidden bg-white">
							<div className="relative w-full h-full">
								<Image
									src={userImage || "/images/de_user.webp"}
									alt="Profile"
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
						className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-pro-max text-white flex items-center justify-center shadow-xl border-2 border-white hover:bg-pro-max/90 hover:scale-110 active:scale-95 transition-all duration-200 z-10 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Change profile picture"
						title="تغيير الصورة الشخصية"
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
					<div className="absolute bottom-full start-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
						<div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
							تغيير الصورة
							<div className="absolute top-full start-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900"></div>
						</div>
					</div>
				</div>
				
				{/* Welcome Text */}
				<div className="text-center m-0 p-0">
					<p className="text-lg font-bold text-slate-900">مرحباً</p>
					
				</div>
			</div>

			<ul className="flex flex-col gap-1">
				{items.map((item) => {
					const isActive =
						pathname === item.href ||
						(item.key === "account" && pathname === "/myAccount") ||
						(item.key === "dashboard" && pathname === "/myAccount");

					const Icon = item.icon;

					const content = (
						<>
							{/* Icon with orange background when active */}
							<div className={`p-1.25 rounded-lg
								${isActive 
									? "bg-orange-500   shadow-md" 
									: ""
								}
								transition-all duration-300
							`}>
								<Icon
									size={18}
									className={`
										transition-colors
										${isActive
											? "text-white"
											: "text-slate-400 group-hover:text-slate-600"
										}
									`}
								/>
							</div>

							{/* Label */}
							<span className={`flex-1 ${isActive ? "text-slate-900" : ""}`}>{item.label}</span>

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
                    group relative flex items-center gap-3 rounded-xl px-4 py-3 w-full
                    text-[0.95rem] font-semibold transition-all duration-300
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-pro
                    text-slate-600 hover:bg-red-50 hover:text-red-600
                  `}
								>
									{content}
								</button>
							) : (
								<Link
									href={item.href}
									className={`
                    group relative flex items-center gap-3 rounded-xl px-4 py-3
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
	);
}
