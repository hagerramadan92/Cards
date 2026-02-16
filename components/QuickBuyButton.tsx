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
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	// State for parent categories
	const [parentCategories, setParentCategories] = useState<any[]>([]);
	const [loadingParentCategories, setLoadingParentCategories] = useState(true);

	// State for selections
	const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
	const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
	const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

	// State for data
	const [cards, setCards] = useState<any[]>([]);
	const [stores, setStores] = useState<any[]>([]);
	const [values, setValues] = useState<any[]>([]);

	// Loading states
	const [loadingCards, setLoadingCards] = useState(false);
	const [loadingStores, setLoadingStores] = useState(false);
	const [loadingValues, setLoadingValues] = useState(false);

	const isProductPage = useMemo(() => {
		return /^\/product\/[^\/]+$/.test(pathname || "") || /^\/products\/[^\/]+$/.test(pathname || "");
	}, [pathname]);

	useEffect(() => setMounted(true), []);

	// Fetch parent categories on mount
	useEffect(() => {
		if (!mounted) return;
		
		setLoadingParentCategories(true);
		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi('categories?type=parent')
				.then((res) => {
					// Assuming the API returns { data: [...] } or directly an array
					const categories = Array.isArray(res) ? res : res?.data || [];
					setParentCategories(categories);
				})
				.catch((err) => {
					console.error('Error fetching parent categories:', err);
					setParentCategories([]);
				})
				.finally(() => setLoadingParentCategories(false));
		});
	}, [mounted]);

	useEffect(() => {
		if (isOpen && mounted) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [isOpen, mounted]);

	// Fetch Cards when Category selected
	useEffect(() => {
		if (!selectedCatId) {
			setCards([]);
			return;
		}
		setLoadingCards(true);
		setCards([]);
		setSelectedCardId(null);
		setSelectedStoreId(null);
		setValues([]);
		
		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`categories/${selectedCatId}`)
				.then((res) => {
					const categoryData = res?.data || res;
					const children = categoryData?.children || [];
					setCards(children);
					// If no cards, try to show products directly
					if (children.length === 0) {
						setValues(categoryData?.products || []);
					}
				})
				.catch(() => setCards([]))
				.finally(() => setLoadingCards(false));
		});
	}, [selectedCatId]);

	// Fetch Stores when Card selected
	useEffect(() => {
		if (!selectedCardId) {
			setStores([]);
			setValues([]);
			return;
		}
		setLoadingStores(true);
		setStores([]);
		setSelectedStoreId(null);

		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`categories/${selectedCardId}`)
				.then((res) => {
					const categoryData = res?.data || res;
					const children = categoryData?.children || [];
					setStores(children);
					// If no stores, try to show products directly
					if (children.length === 0) {
						setValues(categoryData?.products || []);
					}
				})
				.catch(() => setStores([]))
				.finally(() => setLoadingStores(false));
		});
	}, [selectedCardId]);

	// Fetch Products when Store selected
	useEffect(() => {
		if (!selectedStoreId) {
			return;
		}
		setLoadingValues(true);
		setValues([]);

		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`categories/${selectedStoreId}`)
				.then((res) => {
					const categoryData = res?.data || res;
					setValues(categoryData?.products || []);
				})
				.catch(() => setValues([]))
				.finally(() => setLoadingValues(false));
		});
	}, [selectedStoreId]);

	const handleProductClick = (productId: number) => {
		setIsOpen(false);
		router.push(`/product/${productId}`);
	};

	if (!mounted) return null;

	const quickBuyWindow = isOpen && mounted && createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsOpen(false)}
					/>

					{/* Quick Buy Window */}
					<motion.div
						className="fixed bottom-4 left-4 right-4 sm:inset-0 sm:m-auto z-[9999] 
                                    max-w-2xl h-[50vh] sm:h-[500px] 
                                   bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						
					>
						{/* Header */}
						<div className="bg-pro text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
							<div className="flex items-center gap-3">
								<div className="bg-pro-max rounded-full p-1.5 shadow-inner">
									<MdOutlineTouchApp size={20} className="text-white" />
								</div>
								<div>
									<h3 className="font-bold text-[14px]">الشراء السريع</h3>
								</div>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition"
							>
								<AiOutlineClose size={20} />
							</button>
						</div>

						{/* 4 Columns Body - Always 4 columns for layout stability */}
						<div className="grid grid-cols-4 gap-2 bg-gray-50 overflow-y-auto">
							
							{/* Column 1: Categories (Images Only) */}
							<div className="bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">التصنيفات</p>
                                </div>
								<div className="p-2 space-y-3">
									{loadingParentCategories ? (
										[1,2,3,4].map(i => <div key={i} className="w-full aspect-square rounded-full bg-gray-200 animate-pulse" />)
									) : parentCategories?.map((cat: any) => (
										<button
											key={cat.id}
											onClick={() => {
												setSelectedCatId(cat.id);
												setSelectedCardId(null);
												setSelectedStoreId(null);
												setValues([]);
											}}
											className={`w-full aspect-square relative rounded-xl overflow-hidden transition-all duration-200 
                                                ${selectedCatId === cat.id ? 'ring-pro-max ring-offset-2 scale-105 shadow-md' : 'hover:scale-105 hover:opacity-80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                                            title={cat.name}
										>
											{cat.image ? (
												<Image
													src={cat.image}
													alt={cat.name}
													fill
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
													{cat.name?.[0]}
												</div>
											)}
										</button>
									))}
								</div>
							</div>

							{/* Column 2: Cards - Show if selected category has cards OR if loading */}
							<div className="bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">البطاقات</p>
                                </div>
								<div className="p-2 space-y-3">
									{!selectedCatId ? (
										<div className="h-full flex items-center justify-center text-gray-300">
											<BsLightningChargeFill size={20} />
										</div>
									) : loadingCards ? (
										[1,2,3].map(i => <div key={i} className="w-full aspect-square rounded-xl bg-gray-200 animate-pulse" />)
									) : cards.length > 0 ? (
										cards.map((card) => (
											<button
												key={card.id}
												onClick={() => {
													setSelectedCardId(card.id);
													setSelectedStoreId(null);
													setValues([]);
												}}
												className={`w-full aspect-square relative rounded-xl overflow-hidden transition-all duration-200 
                                                    ${selectedCardId === card.id 
                                                        ? ' ring-pro-max ring-offset-2 scale-105 shadow-md' 
                                                        : 'hover:scale-105 hover:opacity-80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                                                title={card.name}
											>
                                                {card.image ? (
                                                    <Image src={card.image} alt={card.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 p-1 text-center leading-tight">
                                                        {card.name}
                                                    </div>
                                                )}
											</button>
										))
									) : (
										<div className="text-center text-[10px] text-gray-400 py-4">لا يوجد بطاقات</div>
									)}
								</div>
							</div>

							{/* Column 3: Store - Show if selected card has stores OR if loading */}
							{stores.length > 0 &&(
										<div className="bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">المتجر</p>
                                </div>
								<div className="p-2 space-y-3">
									{!selectedCardId ? (
										<div className="h-full flex items-center justify-center text-gray-300">
											<div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
										</div>
									) : loadingStores ? (
										[1,2,3].map(i => <div key={i} className="w-full aspect-square rounded-xl bg-gray-200 animate-pulse" />)
									) : stores.length > 0 ? (
										stores.map((store) => (
											<button
												key={store.id}
												onClick={() => setSelectedStoreId(store.id)}
												className={`w-full aspect-square relative rounded-xl overflow-hidden transition-all duration-200 
                                                    ${selectedStoreId === store.id 
                                                        ? ' ring-yellow-400 ring-offset-2 scale-105 shadow-md' 
                                                        : 'hover:scale-105 hover:opacity-80 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                                                title={store.name}
											>
                                                {store.image ? (
                                                    <Image src={store.image} alt={store.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 p-1 text-center leading-tight">
                                                        {store.name}
                                                    </div>
                                                )}
											</button>
										))
									) : (
										<div className="text-center text-[10px] text-gray-400 py-4">لا يوجد متجر</div>
									)}
								</div>
							</div>
							)}
						

							{/* Column 4: Value - Show if selected store has products OR if we're showing direct products */}
							<div className="bg-white overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">القيمة</p>
                                </div>
								<div className="p-2 space-y-3">
									{!selectedCatId ? (
										<div className="h-full flex items-center justify-center text-gray-300">
											<div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
										</div>
									) : loadingValues ? (
										[1,2,3,4].map(i => <div key={i} className="w-full aspect-square rounded-xl bg-gray-200 animate-pulse" />)
									) : values.length > 0 ? (
										values.map((val) => (
											<button
												key={val.id}
												onClick={() => handleProductClick(val.id)}
												className="w-full aspect-square group bg-white hover:shadow-md border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 relative"
                                                title={`${val.name} - ${val.price}`}
											>
                                                {val.image ? (
													<div className="relative w-full h-full">
														<Image 
															src={val.image} 
															alt={val.name} 
															fill 
															className="object-cover"
														/>
														<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] p-1 text-center">
															{val.price}
														</div>
													</div>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-1">
                                                        <span className="text-xs font-bold text-pro-max">
                                                            {val.price}
                                                        </span>
                                                        <span className="text-[8px] text-gray-400">ج.م</span>
                                                    </div>
                                                )}
											</button>
										))
									) : (
										<div className="text-center text-[10px] text-gray-400 py-4">اختر منتج</div>
									)}
								</div>
							</div>

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
					isProductPage ? "max-sm:bottom-[14px] !left-3" : "",
				].join(" ")}
			>
				<MdOutlineTouchApp size={20} className="text-white sm:w-6 sm:h-6" />
			</motion.button>

			{quickBuyWindow}
		</>
	);
}