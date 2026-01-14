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
		
		// Assuming 'cards' are subcategories of the parent category
		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`categories?parent_id=${selectedCatId}`)
				.then((res) => {
					setCards(Array.isArray(res) ? res : []);
				})
				.catch(() => setCards([]))
				.finally(() => setLoadingCards(false));
		});
	}, [selectedCatId]);

	// Fetch Stores when Card selected
	useEffect(() => {
		if (!selectedCardId) {
			setStores([]);
			return;
		}
		setLoadingStores(true);
		setStores([]);
		setSelectedStoreId(null);

		// Assuming 'stores' are subcategories of the 'card' category
		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`categories?parent_id=${selectedCardId}`)
				.then((res) => {
					setStores(Array.isArray(res) ? res : []);
				})
				.catch(() => setStores([]))
				.finally(() => setLoadingStores(false));
		});
	}, [selectedCardId]);

	// Fetch Values (Products) when Store selected
	useEffect(() => {
		if (!selectedStoreId) {
			setValues([]);
			return;
		}
		setLoadingValues(true);
		setValues([]);

		// Assuming 'values' are products of the 'store' category
		import("@/lib/api").then(({ fetchApi }) => {
			fetchApi(`products?category_id=${selectedStoreId}`)
				.then((res) => {
					setValues(Array.isArray(res) ? res : []);
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

						{/* 4 Columns Body */}
						<div className="grid grid-cols-4 gap-2 bg-gray-50 overflow-y-auto">
							
							{/* Column 1: Categories (Images Only) */}
							<div className="w-[80px] sm:w-[90px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">التصنيفات</p>
                                </div>
								<div className="p-2 space-y-3">
									{loadingCategories ? (
										[1,2,3,4].map(i => <div key={i} className="w-full aspect-square rounded-full bg-gray-200 animate-pulse" />)
									) : parentCategories?.map((cat: any) => (
										<button
											key={cat.id}
											onClick={() => setSelectedCatId(cat.id)}
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

							{/* Column 2: Cards */}
							<div className="w-[80px] sm:w-[90px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
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
												onClick={() => setSelectedCardId(card.id)}
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
										<div className="text-center text-[10px] text-gray-400 py-4">لا يوجد</div>
									)}
								</div>
							</div>

							{/* Column 3: Store */}
							<div className="w-[80px] sm:w-[90px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
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
										<div className="text-center text-[10px] text-gray-400 py-4">لا يوجد</div>
									)}
								</div>
							</div>

							{/* Column 4: Value */}
							<div className="w-[80px] sm:w-[90px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar">
								<div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400">القيمة</p>
                                </div>
								<div className="p-2 space-y-3">
									{!selectedStoreId ? (
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
                                                title={`${val.name} - ${val.price} ج.م`}
											>
                                                {val.image ? (
													<span>{val.price}</span>
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
										<div className="text-center text-[10px] text-gray-400 py-4">لا يوجد</div>
									)}
								</div>
							</div>

						</div>

						{/* Footer - Optional */}
						{/* <div className="p-3 bg-white border-t border-gray-200 flex justify-end">
                            <span className="text-xs text-gray-400">اختر العناصر للمتابعة</span>
						</div> */}
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

