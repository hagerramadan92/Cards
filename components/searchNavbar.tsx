"use client";

import Image from "@/components/ImageWithFallback";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegUser } from "react-icons/fa";
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
import ThemeToggle from "./ThemeToggle";

function cn(...c: (string | false | null | undefined)[]) {
	return c.filter(Boolean).join(" ");
}

export default function SearchNavbar() {
	const [menuOpen, setMenuOpen] = useState(false);

	const { fullName, isLoading, isAuthenticated } = useAuth();
	const { parentCategories, loadingCategories } = useAppContext();
	const { t } = useLanguage();



	return (
		<div className="bg-transparent">
			{/* Navbar */}
			<div className="w-full app-container relative z-30 border-b" style={{ borderColor: "var(--nav-border)" }}>
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
								"backdrop-blur ",
								"hover:shadow-md",
								"active:scale-95 transition-all duration-200",
								"focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
							)}
							style={{ background: "var(--surface-subtle)", color: "var(--text-primary)" }}
						>
							{/* soft glow */}
							<span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-slate-100 to-white opacity-0 hover:opacity-100 transition" />

							<motion.span
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.92 }}
								className="relative z-10 flex items-center justify-center"
							>
								{/* <FaBars size={18} /> */}
								<FaBarsStaggered size={22} className="text-orange-400" />
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
						<ThemeToggle />

						{/* Language Selector - Hide on mobile (in drawer) */}
						<div className="sm:block hidden">
							<LanguageSelector />
						</div>
						{/* Auth */}
						<div className="flex min-w-[44px] justify-end lg:min-w-[210px]">
							{isLoading ? (
								// عرض مؤشر تحميل أثناء الانتظار
								<div className="inline-flex items-center justify-center rounded-full border px-3 py-2 md:px-4 md:py-2.5" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}>
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-orange-400"></div>
								</div>
							) : !isAuthenticated ? (
								<Link
									href="/login"
									className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-extrabold shadow-sm hover:bg-orange-500/16 active:scale-[0.99] transition"
								>
									<FaRegUser className="" size={15} />
									<span className="max-md:hidden">{t('login')}</span>
									<span className="md:hidden">{t('login_short')}</span>
								</Link>
							) : (
								<DropdownUser />
							)}
						</div>

						{/* country & currency - Hide on very small screens if needed, or keep */}
						<div className="hidden min-w-[120px] items-center justify-end gap-2 sm:flex">
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
								"fixed z-50 shadow-2xl overflow-hidden flex flex-col",
								"w-screen md:w-[420px]",
								"  top-0  right-0",
								" h-dvh max-h-dvh",
								"md:rounded-t-3xl md:rounded-none"
							)}
							style={{ background: "var(--surface)", color: "var(--text-primary)" }}
						>

							{/* Drawer header */}
							<div className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-5 py-4 border-b" style={{ background: "linear-gradient(180deg, var(--surface-secondary), var(--surface))", borderColor: "var(--border)" }}>
								<div className="flex min-w-0 items-center gap-3">
									<div className="relative w-10 h-10 shrink-0 rounded-2xl bg-white/6 shadow-sm ring-1 ring-white/10 overflow-hidden">
										<Image src="/images/logo11.png" alt="logo" fill sizes="40px" className="object-contain p-1.5" />
									</div>
									<div className="min-w-0">
										<h2 className="text-lg md:text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>{t('menu')}</h2>
										<p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{t('footer_text')}</p>
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									
									<ThemeToggle className="!min-h-10 !px-3" />
									<button
										aria-label="Close menu"
										onClick={() => setMenuOpen(false)}
										className="rounded-xl p-2 transition focus:outline-none focus:ring-4 focus:ring-white/10"
										style={{ color: "var(--text-muted)" }}
									>
										<AiOutlineClose size={22} />
									</button>
								</div>
							</div>
							<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
							 <div className="flex flex-col gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
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
							<div className="p-4 space-y-5">
								{/* Search inside drawer for mobile */}
								<div className="md:hidden">
									<p className="text-sm font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>{t('search')}</p>
									<div className="flex items-center gap-2 " > 
										<SearchGrowWrap inDrawer>
											<SearchComponent setMenuOpen={setMenuOpen} />
										</SearchGrowWrap>
									</div>
								</div>

								<Link
									href="/contactUs"
									onClick={() => setMenuOpen(false)}
									className="md:hidden flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-extrabold transition hover:shadow-sm"
									style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
								>
									<span>{t('contact_us')}</span>
									<LuPhone size={18} className="text-orange-400" />
								</Link>


								{/* Categories */}
								<div className="mt-4 w-full gap-3">
									{loadingCategories ? (
										Array.from({ length: 6 }).map((_, i) => (
											<div
												key={i}
											className="rounded-2xl border p-4 shadow-sm"
											style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
											>
												<div className="flex items-center gap-3">
													<div className="h-12 w-12 rounded-2xl bg-white/10 animate-pulse" />
													<div className="flex-1">
														<div className="h-4 w-24 rounded animate-pulse" style={{ background: "var(--surface-subtle-hover)" }} />
														<div className="mt-2 h-3 w-16 rounded animate-pulse" style={{ background: "var(--surface-subtle-hover)" }} />
													</div>
												</div>
											</div>
										))
									) : <CategoriesSlider inSlide={true} categories={parentCategories}   onCategoryClick={() => setMenuOpen(false)} />
									}
								</div>

								{/* Empty state */}
								{!loadingCategories && (!parentCategories || parentCategories.length === 0) && (
									<div className="mt-4 rounded-2xl border p-4 text-sm" style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
										{t('no_categories')}
									</div>
								)}

							</div>
							</div>

							{/* Drawer footer */}
							<div className="shrink-0 border-t p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
								{!isAuthenticated ? (
									<Link
										href="/login"
										onClick={() => setMenuOpen(false)}
										className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3 text-sm font-extrabold shadow-sm hover:opacity-95 transition"
									>
										<FaRegUser size={15} />
										تسجيل دخول
									</Link>
								) : (
									<button
										onClick={() => setMenuOpen(false)}
										className="w-full rounded-2xl py-3 text-sm font-extrabold transition"
										style={{ background: "var(--surface-subtle)", color: "var(--text-primary)" }}
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
