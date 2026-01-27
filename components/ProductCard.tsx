'use client';

import { useMemo, useRef, useState } from 'react';
import HearComponent from './HearComponent';
import PriceComponent from './PriceComponent';
import ImageComponent from './ImageComponent';
import Link from 'next/link';
import { useParams, useRouter } from "next/navigation";
import { IoMdCart } from 'react-icons/io';
import { PiDiamondFill } from 'react-icons/pi';
import { FaFlag } from 'react-icons/fa';
import { useCart } from '@/src/context/CartContext';
import BottomSlider from './BottomSlider';
import { ProductI } from '@/Types/ProductsI';
import ShowImage from './ShowImage';
import RatingStars from './RatingStars';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickViewModal from './QuickViewModal';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { SelectedOptions } from './StickerForm';
import { useLanguage } from '@/src/context/LanguageContext';
export interface StickerFormHandle {
	getOptions: () => SelectedOptions;
	validate: () => boolean;
}
const DEFAULT_CARD_WIDTH =
  "w-[140px] \
   [@media_(max-width:328px)]:w-[135px] \
   [@media_(min-width:329px)_and_(max-width:639px)]:w-[160px] \
   sm:w-[200px] md:w-[218px]";
export default function ProductCard({
	product,
	id,
	image,
	name,
	price,
	final_price,
	discount,
	stock,
	classNameHome = '',
	classNameCate = '',
	average_rating,
	reviews,
	is_favorite,
	selectedSizeId,
	selectedColorId,
	selectedPrintingMethodId,
	selectedPrintLocations = [],
	selectedEmbroiderLocations = [],
	selectedOptions: propSelectedOptions = [],
	selectedDesignServiceId,
	isSample = false,
	widthClass = DEFAULT_CARD_WIDTH,

}: any) {
	const [showImage, setShowImage] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [quickViewOpen, setQuickViewOpen] = useState(false);
	const { t, language } = useLanguage();

	const { authToken: token, favoriteIdsSet, setFavoriteProducts, favoriteProductsLoading } = useAuth();
	const { data: session } = useSession();
	const router = useRouter();
	const computedIsFavorite = useMemo(() => {
		if (favoriteProductsLoading) {
			return is_favorite;
		}
		if (favoriteIdsSet?.has(id)) return true;
		return false;
	}, [favoriteIdsSet, id, is_favorite, favoriteProductsLoading]);

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	const inStock = (stock ?? 0) > 0;

	const toggleFavorite = async (productId: number) => {
		if (!token && !session) {
			toast.error(t('login')); // Use login key as placeholder for "Login required"
			return;
		}

		const next = !computedIsFavorite;

		// ✅ Optimistic: حدّث الكونتكست
		setFavoriteProducts((prev: ProductI[]) => {
			if (next) {
				if (prev.some((p) => p.id === productId)) return prev;
				
				const newProduct: any = {
					...product,
					id: productId,
					name,
					image,
					price,
					final_price,
					discount,
					stock,
					is_favorite: true,
				};
				return [...prev, newProduct];
			} else {
				return prev.filter((p) => p.id !== productId);
			}
		});

		// localStorage (اختياري)
		try {
			const raw = localStorage.getItem('favorites');
			const arr = raw ? (JSON.parse(raw) as number[]) : [];
			const set = new Set(arr);
			next ? set.add(productId) : set.delete(productId);
			localStorage.setItem('favorites', JSON.stringify([...set]));
		} catch { }

		try {
			if (token) {
				const res = await fetch(`${API_URL}/favorites/toggle`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept-Language': language,
						Accept: 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ product_id: productId }),
				});

				const data = await res.json().catch(() => null);

				if (!res.ok || !data?.status) {
					// ✅ rollback context
					setFavoriteProducts((prev: ProductI[]) => {
						if (!next) {
							if (prev.some((p) => p.id === productId)) return prev;
							return [...prev, { id: productId } as ProductI];
						} else {
							return prev.filter((p) => p.id !== productId);
						}
					});

					toast.error(data?.message || t('error_loading'));
					return;
				}
			}
		} catch {
			// ✅ rollback context
			setFavoriteProducts((prev: ProductI[]) => {
				if (!next) {
					if (prev.some((p) => p.id === productId)) return prev;
					return [...prev, { id: productId } as ProductI];
				} else {
					return prev.filter((p) => p.id !== productId);
				}
			});

			toast.error(t('error_loading'));
		}
	};

	const { addToCart } = useCart();

	const handleAddToCart = async () => {
		// allow if token exists OR session exists
		if (!token && !session) {
			toast.error(t('login'));
			return;
		}
		if (isAdding || !inStock) return;

		setIsAdding(true);

		await addToCart(id, {
			quantity: 1,
		});

		setIsAdding(false);
	};

	// ✅ show lowest_price when final_price == 0 (or missing)
	const displayFinalPrice = useMemo(() => {
		const fp = Number(final_price || 0);
		if (fp > 0) return fp;

		const lp = Number(product?.lowest_price ?? 0);
		return lp > 0 ? lp : 0;
	}, [final_price, product?.lowest_price]);

	const displayPrice = useMemo(() => {
		const p = Number(price || 0);
		return p > 0 ? p : 0;
	}, [price]);
	const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
			size: "اختر",
			size_tier_id: null,
			size_quantity: null,
			size_price_per_unit: null,
			size_total_price: null,
	
			color: "اختر",
			material: "اختر",
			optionGroups: {},
			printing_method: "اختر",
			print_locations: [],
			isValid: false,
		});
	const [showValidation, setShowValidation] = useState(false);
		const stickerFormRef = useRef<StickerFormHandle | null>(null);
	
	const getSelectedOptions = async () => {
		if (stickerFormRef.current?.getOptions) {
			const opts = await stickerFormRef.current.getOptions();
			setSelectedOptions(opts);
			return opts;
		}
		return selectedOptions;
	};
	const priceHasDiscount = useMemo(() => {
		if (!displayFinalPrice) return false;
		if (!displayPrice) return false;
		return displayPrice !== displayFinalPrice;
	}, [displayPrice, displayFinalPrice]);
 const handleBuyNow = async () => {
		setShowValidation(true);
 
		const opts = await getSelectedOptions();
		
 
		
 
		if (!token) return toast.error(t('login'));
		if (!API_URL) return toast.error(t('error_loading'));
 
		// const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		// const idsPayload = buildIdsPayload(apiData, opts);
 
		const qty = Math.max(1, Number(opts?.size_quantity || 1));
 
		const cartData = {
			product_id: product.id,
			quantity: qty,
			// ...idsPayload,
			// selected_options,
			// design_service_id: null,
			// is_sample: false,
			note: "",
			image_design: null,
		};
 
		try {
			const res: any = await addToCart(product.id, cartData);
  
			const cartItemId =
				Number(res?.data?.cart_item_id) ||
				Number(res?.data?.id) ||
				Number(res?.cart_item_id) ||
				Number(res?.id) ||
				null;
 
			// const fileToUpload = designFile || stickerDesignFile;
 
			// if (fileToUpload) {
			// 	if (!cartItemId) {
			// 		toast.error("تمت الإضافة للسلة لكن لم يتم العثور على cart_item_id لربط ملف التصميم. يمكنك رفعه من السلة.");
			// 		router.push("/cart");
			// 		return;
			// 	}
 
			
			// }
 
			toast.success(t('add_to_cart')); // Reuse add_to_cart for success
			router.push("/cart");
		} catch {
			toast.error(t('error_loading'));
		}
	};
	const showDiscountChip = Boolean(discount?.value); 
	return (
		<motion.div
			className="relative group"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
		>
			<motion.div
				whileHover={{ y: -3 }}
				transition={{ type: 'spring', stiffness: 260, damping: 18 }}
				className={`relative flex flex-col rounded-lg md:rounded-xl border
				 border-slate-200 bg-white overflow-hidden
                    shadow-sm hover:border-gray-200 transition
					${widthClass} sm:w-[200px] md:w-[218px]`}
			>
				{/* Image */}
				<div className={`relative ${widthClass} 
				h-[105px] md:h-[105px] bg-gray-50 sm:w-[200px] md:w-[218px]`}>
					{/* Flag - Top Left */}
					<div className="absolute start-2 top-2 z-30">
						{/* <div className=" w-5 h-5 rounded-full  backdrop-blur-sm flex items-center justify-center ">
							<Image src="/images/flag.svg" alt="flag" width={20} height={20} className="w-full h-full" />
						</div> */}
							{inStock && (
							<motion.button
								aria-label={t('add_to_cart')}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleAddToCart();
								}}
								disabled={isAdding}
								whileHover={!isAdding ? { scale: 1.06 } : undefined}
								whileTap={!isAdding ? { scale: 0.92 } : undefined}
								className="z-20"
							>
								<div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-1 ring-black/5 bg-white text-pro">
									{isAdding ? (
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									) : (
										<IoMdCart className="w-5 h-5" />
									)}
								</div>
							</motion.button>
						)}
					</div>

					{/* VIP Diamond Icon */}
					<div className="absolute start-2 px-0.5 bg-white  bottom-[-17px] z-20 flex items-center rounded-full gap-0 shadow-lg">
						{/* <PiDiamondFill className="w-4 h-4 md:w-5 md:h-5 text-pro" /> */}
						<Image
							src="/images/diamond.svg"
							alt="diamond"
							width={20}
							height={20}
							className="w-4 h-4 md:w-5 md:h-5 "
						/>
						<span className="text-sm font-bold pe-2 py-0.5 text-pro-max ">
							{id}
						</span>
					</div>
					<Link href={`/product/${id}`} className="block h-full">
						<div className="relative h-full overflow-hidden">
							<ImageComponent image={image || '/images/c1.png'} />
							<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
						</div>
					</Link>

					{/* Top actions - Right side (Favorite and Add to Cart) */}
					<div className="absolute top-2 end-2 z-30 flex flex-col items-center gap-2">
						<div className=" w-5 h-5 rounded-full  backdrop-blur-sm flex items-center justify-center ">
							<Image src="/images/flag.svg" alt="flag" width={20} height={20} className="w-full h-full" />
						</div>
					
						</div>
						<div className="absolute bottom-[-17px] end-2 z-30 flex flex-col items-center gap-2">
						{/* Add to Cart */}
						{/* {inStock && (
							<motion.button
								aria-label="add to cart"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleAddToCart();
								}}
								disabled={isAdding}
								whileHover={!isAdding ? { scale: 1.06 } : undefined}
								whileTap={!isAdding ? { scale: 0.92 } : undefined}
								className="z-20"
							>
								<div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-1 ring-black/5 bg-pro text-white">
									{isAdding ? (
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									) : (
										<IoMdCart className="w-5 h-5" />
									)}
								</div>
							</motion.button>
						)} */}
							{/* Favorite */}
						<HearComponent
							onToggleLike={() => toggleFavorite(id)}
							liked={computedIsFavorite}
							ClassName="text-pro "
							ClassNameP="!w-8 !h-8"
						/>
					</div>

					{/* Discount - Bottom Right */}
					{showDiscountChip && (
						<div className="absolute bottom-2 md:bottom-3 end-2 md:end-3 z-20">
							<span className="px-3 py-1 text-[11px] font-extrabold rounded-lg md:rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
								-{discount?.value}%
							</span>
						</div>
					)}

					<QuickViewModal
						open={quickViewOpen}
						onClose={() => setQuickViewOpen(false)}
						product={product}

						onAddToCart={handleAddToCart}
						isAdding={isAdding}
					/>

					<AnimatePresence>
						{showImage && <ShowImage onClose={() => setShowImage(false)} src={image || '/images/c1.png'} />}
					</AnimatePresence>
				</div>

				{/* Content */}
				<div className="p-2 space-y-3 mt-4">
					<Link href={`/product/${id}`}>
						<h3 className="text-sm md:text-[16px] font-extrabold text-gray-900 line-clamp-1 hover:text-pro transition">
							{name}
						</h3>
					</Link>

					{/* Price */}
					<div className={`flex items-center gap-2 max-md:!mb-1 ${classNameHome}`}>
						{displayFinalPrice > 0 ? (
							<div className='flex items-center gap-1 flex-wrap' >
								<PriceComponent start price_text={product?.price_text} />
								{priceHasDiscount && (
									<span className="text-sm text-gray-400 line-through">{displayPrice} ج.م</span>
								)}
							</div>
						) : null}
					</div>

					{/* Rating */}

					{/* Divider */}
					<div className="h-px bg-gray-200/70" />

					{/* Buy Now Button or Out of Stock */}
					{inStock ? (
						<button
							onClick={handleBuyNow}
								aria-label={t('buy_now')}
								className={`flex items-center justify-center w-full cursor-pointer whitespace-nowrap   gap-2 px-4 py-2 rounded-lg bg-pro text-white hover:bg-pro/90 transition-colors duration-200 font-semibold text-sm `}
							>
								<span>{t('buy_now')}</span>
								<ShoppingCart className="w-4 h-4" />
						</button>
					) : (
						<div className="w-full bg-gray-200 text-gray-600 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm cursor-not-allowed">
							<span>{t('out_of_stock')}</span>
						</div>
					)}

					{/* Bottom */}
					<BottomSlider text_ads={product?.text_ads} />
				</div>
			</motion.div>
		</motion.div>
	);
}
