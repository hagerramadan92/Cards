"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaRegUser } from "react-icons/fa";
import { LuPhone } from "react-icons/lu";
import { AiOutlineClose } from "react-icons/ai";
import SearchComponent from "./SearchComponent";
import CartSidebar from "./CartSideBar";
import DropdownUser from "./DropdownUser";
import { useAuth } from "@/src/context/AuthContext";
import { useAppContext } from "@/src/context/AppContext";
import Logo from "./Logo";
import CategoriesSlider from "./CategoriesC";
import LanguageSelector from "./LanguageSelector";
import { FaBarsStaggered } from "react-icons/fa6";
import CurrencySelector from "./Currency/CurrencySelector";
import { useLanguage } from "@/src/context/LanguageContext";
import CurrencyDisplay from "./Currency/CurrencySelector";

function cn(...c: (string | false | null | undefined)[]) {
	return c.filter(Boolean).join(" ");
}

export default function SearchNavbar() {
	const [menuOpen, setMenuOpen] = useState(false);

	const { authToken, fullName, isLoading, isAuthenticated } = useAuth();
	const { socialMedia, parentCategories, loadingCategories } = useAppContext();
	const { t } = useLanguage();

	// ✅ guard against undefined / wrong type
	const socials = useMemo(
		() => (Array.isArray(socialMedia) ? socialMedia : []),
		[socialMedia]
	);



	return (
		<div className="bg-white/80  " >
			{/* Navbar */}
			<div className="w-full container relative z-30 border-b border-gray-200">
				<div className="flex flex-1 min-w-0 items-center justify-between gap-3 py-3 md:py-4">
					
					{/* Left Section: Menu, Logo, Search */}
					<div className="flex items-center gap-3 flex-1 min-w-0">
						{/* Menu button */}
						<button
							onClick={() => setMenuOpen(true)}
							aria-label={t('menu')}
							className={cn(
								"md:hidden shrink-0 relative",
								"rounded-xl ",
								"bg-white/90 backdrop-blur ",
								"text-slate-800 ",
								"hover:shadow-md hover:bg-white",
								"active:scale-95 transition-all duration-200",
								"focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
							)}
						>
							{/* soft glow */}
							<span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-slate-100 to-white opacity-0 hover:opacity-100 transition" />

							<motion.span
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.92 }}
								className="relative z-10 flex items-center justify-center"
							>
								{/* <FaBars size={18} /> */}
								<FaBarsStaggered size={22} className="text-pro" />
							</motion.span>
						</button>

						<Logo className="shrink-0" />

						<div
							className={cn(
								"min-w-0 flex-1 max-w-2xl",
								"transition-all max-md:hidden duration-300"
							)}
						>
							
							<SearchGrowWrap >
								<SearchComponent />
							</SearchGrowWrap>
						</div>
					</div>

					{/* Right Section: Actions */}
					<div className="flex items-center gap-2 md:gap-3 shrink-0">
						{/* Language Selector - Hide on mobile (in drawer) */}
						<div className="sm:block hidden">
							<LanguageSelector />
						</div>
						{/* Auth */}
					{isLoading ? (
						// عرض مؤشر تحميل أثناء الانتظار
						<div className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2 md:px-4 md:py-2.5">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-pro"></div>
						</div>
					) : !isAuthenticated ? (
						<Link
							href="/login"
							className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-gray-100 text-pro px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-extrabold shadow-sm hover:opacity-95 active:scale-[0.99] transition"
						>
							<FaRegUser className="" size={15} />
							<span className="max-md:hidden">{t('login')}</span>
							<span className="md:hidden">{t('login_short')}</span>
						</Link>
					) : (
						<DropdownUser />
					)}

						{/* country & currency - Hide on very small screens if needed, or keep */}
						<div className="hidden sm:flex items-center gap-2">
							{/* <div className="rounded-full w-[24px] h-[24px] flex items-center justify-center overflow-hidden">
								<Image src="/images/eg.avif" alt="flag" width={20} height={20} className="object-cover w-full h-full" />
							</div> */}
							<CurrencyDisplay />
						</div>

						

						{/* Cart */}
						<div className={`cursor-pointer ${!fullName && "hidden"}`}>
							<CartSidebar />
						</div>
					</div>
					
				</div>
			</div>

			{/* Mobile/Tablet Drawer */}
			<AnimatePresence>
				{menuOpen && (
					<>
						{/* Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.55 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 bg-black  "
							onClick={() => setMenuOpen(false)}
						/>

						{/* Drawer: bottom sheet on mobile, right drawer on md+ */}
						<motion.aside
							role="dialog"
							aria-modal="true"
							initial={{ y: "100%", x: "0%" }}
							animate={{ y: "0%", x: "0%" }}
							exit={{ y: "100%", x: "0%" }}
							transition={{ type: "spring", stiffness: 320, damping: 34 }}
							className={cn(
								"fixed z-50 bg-white shadow-2xl overflow-hidden",
								"w-screen md:w-[420px]",
								"  top-0  right-0",
								" h-full",
								"md:rounded-t-3xl md:rounded-none"
							)}
						>

							{/* Drawer header */}
							<div className="   flex items-center justify-between px-4 md:px-5 py-4 border-b border-slate-200 bg-gradient-to-b from-gray-50 to-white">
								<div className="flex items-center gap-3">
									<div className="relative w-10 h-10 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
										<Image src="/images/logo11.png" alt="logo" fill className="object-contain p-1.5" />
									</div>
									<div>
										<h2 className="text-lg md:text-xl font-extrabold text-gray-900">{t('menu')}</h2>
										<p className="text-xs text-gray-500">{t('footer_text')}</p>
									</div>
								</div>

								<div className="flex items-center gap-2">
									
									<button
										aria-label="Close menu"
										onClick={() => setMenuOpen(false)}
										className="rounded-xl p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition focus:outline-none focus:ring-4 focus:ring-gray-200"
									>
										<AiOutlineClose size={22} />
									</button>
								</div>
							</div>
							 <div className="flex flex-col px-2">
								{/* Language Selector for Mobile */}
							<div className="md:hidden flex items-center justify-between">
								<p>{t('language')}</p>
								<LanguageSelector />
							</div>
							<div className="md:hidden flex items-center justify-between">
								<p>{t('currency')}</p>
								<CurrencySelector/>
							</div>
							 </div>

							{/* Drawer content */}
							<div className="  p-2 space-y-5 !pl-4 ">
								{/* Search inside drawer for mobile */}
								<div className="md:hidden">
									<p className="text-sm font-extrabold text-gray-800 mb-2">{t('search')}</p>
									<div className="flex items-center gap-2 " > 
										<SearchGrowWrap inDrawer>
											<SearchComponent setMenuOpen={setMenuOpen} />
										</SearchGrowWrap>
									</div>
								</div>


								{/* Categories */}
								<div className="mt-4 w-full gap-3">
									{loadingCategories ? (
										Array.from({ length: 6 }).map((_, i) => (
											<div
												key={i}
												className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
											>
												<div className="flex items-center gap-3">
													<div className="h-12 w-12 rounded-2xl bg-slate-100 animate-pulse" />
													<div className="flex-1">
														<div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
														<div className="mt-2 h-3 w-16 rounded bg-slate-100 animate-pulse" />
													</div>
												</div>
											</div>
										))
									) : <CategoriesSlider inSlide={true} categories={parentCategories} />
									}
								</div>

								{/* Empty state */}
								{!loadingCategories && (!parentCategories || parentCategories.length === 0) && (
									<div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-gray-500">
										{t('no_categories')}
									</div>
								)}

							</div>

							{/* Drawer footer */}
							<div className="mt-auto border-slate-200 border-t p-5 bg-white">
								{!isAuthenticated ? (
									<Link
										href="/login"
										onClick={() => setMenuOpen(false)}
										className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pro text-white py-3 text-sm font-extrabold shadow-sm hover:opacity-95 transition"
									>
										<FaRegUser size={15} />
										تسجيل دخول
									</Link>
								) : (
									<button
										onClick={() => setMenuOpen(false)}
										className="w-full rounded-2xl bg-gray-100 text-gray-900 py-3 text-sm font-extrabold hover:bg-gray-200 transition"
									>
										إغلاق
									</button>
								)}
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}


function SearchGrowWrap({
	children,
	inDrawer = false,
}: {
	children: React.ReactNode;
	inDrawer?: boolean;
}) {
	return (
		<div
			className={cn(
				"transition-all duration-300",
				"focus-within:w-full",
				inDrawer
					? "w-full"
					: "w-[180px] sm:w-[240px] md:w-[320px] lg:w-[420px] xl:w-[520px] focus-within:w-[92vw] md:focus-within:w-[560px]",
				"max-w-full"
			)}
		>
			{children}
		</div>
	);
}
