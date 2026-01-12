"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AiOutlineClose } from "react-icons/ai";
import { BsLightningChargeFill } from "react-icons/bs";
import { createPortal } from "react-dom";
import { useAppContext } from "@/src/context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { MdOutlineTouchApp } from "react-icons/md";

export default function QuickBuyButton() {
	const pathname = usePathname();
	const router = useRouter();
	const { parentCategories, loadingCategories } = useAppContext();
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	const isProductPage = useMemo(() => {
		return /^\/product\/[^\/]+$/.test(pathname || "") || /^\/products\/[^\/]+$/.test(pathname || "");
	}, [pathname]);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (isOpen && mounted) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [isOpen, mounted]);

	const handleCategoryClick = (categoryId: number) => {
		setIsOpen(false);
		router.push(`/category/${categoryId}`);
	};

	if (!mounted) return null;

	const quickBuyWindow = isOpen && mounted && createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-[9998] bg-black/50"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsOpen(false)}
					/>

					{/* Quick Buy Window */}
					<motion.div
						className="fixed bottom-4 left-4 sm:bottom-20 sm:left-5 z-[9999] w-[320px] h-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] sm:w-[380px] sm:h-[600px] bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						dir="rtl"
					>
						{/* Header */}
						<div className="bg-pro text-white px-2.5 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
							<div className="flex items-center gap-1.5 sm:gap-3">
								<div className="bg-pro-max rounded-full p-1">
								<MdOutlineTouchApp size={18} className="sm:w-6  sm:h-6 flex-shrink-0" />

								</div>
								
								<div className="min-w-0">
									<h3 className="font-bold text-[11px] sm:text-sm truncate">الشراء السريع</h3>
									<p className="text-[10px] sm:text-xs text-white/80 truncate">اختر التصنيف</p>
								</div>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="w-6 h-6 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
								aria-label="Close"
							>
								<AiOutlineClose size={14} className="sm:w-[18px] sm:h-[18px]" />
							</button>
						</div>

						{/* Categories List */}
						<div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
							{loadingCategories ? (
								<div className="flex items-center justify-center h-full">
									<div className="text-gray-400 text-xs sm:text-sm">جاري التحميل...</div>
								</div>
							) : parentCategories && parentCategories.length > 0 ? (
								<div className="space-y-1.5 sm:space-y-2">
									{parentCategories.map((category: any) => (
										<button
											key={category.id}
											onClick={() => handleCategoryClick(category.id)}
											className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all shadow-sm hover:shadow-md text-right"
										>
											{category.image && (
												<div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0">
													<Image
														src={category.image}
														alt={category.name || ""}
														fill
														className="object-cover"
													/>
												</div>
											)}
											<div className="flex-1 min-w-0">
												<p className="font-bold text-gray-900 text-xs sm:text-sm truncate">
													{category.name}
												</p>
												{category.description && (
													<p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5 sm:mt-1">
														{category.description}
													</p>
												)}
											</div>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												className="text-gray-400 flex-shrink-0 sm:w-5 sm:h-5"
											>
												<path d="M9 18l6-6-6-6" />
											</svg>
										</button>
									))}
								</div>
							) : (
								<div className="flex items-center justify-center h-full">
									<div className="text-gray-400 text-center text-xs sm:text-sm">
										<p>لا توجد تصنيفات متاحة</p>
									</div>
								</div>
							)}
						</div>

						{/* Footer - View All */}
						<div className="p-2 sm:p-4 bg-white border-t border-gray-200">
							<Link
								href="/category"
								onClick={() => setIsOpen(false)}
								className="w-full bg-pro text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-pro/90 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
							>
								<span>عرض كل التصنيفات</span>
							</Link>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);

	return (
		<>
			{/* Quick Buy Button */}
			<motion.button
				onClick={() => setIsOpen(true)}
				aria-label="الشراء السريع"
				initial={{ opacity: 0, scale: 0.6, y: 40 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.95 }}
				className={[
					"fixed left-4 sm:left-5 z-[9997] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-pro-max flex items-center justify-center shadow-xl hover:shadow-2xl",
					"bottom-4 sm:bottom-5",
					isProductPage ? "max-sm:bottom-[200px] !left-3" : "",
				].join(" ")}
			>
				<MdOutlineTouchApp size={20} className="text-white sm:w-6 sm:h-6" />
			</motion.button>

			{quickBuyWindow}
		</>
	);
}

