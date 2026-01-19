"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ProductI } from "@/Types/ProductsI";
import CategoryPageSkeleton from "@/components/skeletons/HomeSkeletons";
import { ChevronDown, ChevronRight, ChevronLeft, BookOpen, FileText, Package } from "lucide-react";
import { FormControl, Select } from "@mui/material";
import { MenuItem } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Link from "next/link";


interface CategoryChild {
	id: number;
	name: string;
	slug: string;
	image?: string;
}

interface CategoryData {
	id: number;
	name: string;
	slug: string;
	image?: string;
	sub_image?: string;
	is_parent: boolean;
	children: CategoryChild[];
	products: ProductI[];
	category_banners: { image: string }[];
	description?: string;
	instructions?: string;
	terms?: string;
}

/* -------------------- Sub-Category Card -------------------- */
function CategoryCard({ category }: { category: CategoryChild }) {
	return (
		<motion.div
			whileHover={{ y: -6 }}
			transition={{ type: "spring", stiffness: 260, damping: 18 }}
			className="group rounded-lg border border-slate-100 cursor-pointer 
			bg-white mx-auto overflow-hidden shadow-sm 
			hover:shadow-md w-full h-[120px] sm:h-[140px] md:h-[160px]"
		>
			<Link href={`/category/${category.id}`} className="flex flex-col items-center justify-center gap-1 md:gap-2">
				<div className="relative bg-slate-50 mt-1.5 md:mt-3 w-[85%] h-[80px] md:h-[105px]">
					<Image
						src={category.image || "/images/noimg.png"}
						alt={category.name}
						fill
						sizes="(max-width: 768px) 100vw, 25vw"
						className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
					/>
				</div>
				<h3 className="text-xs md:text-sm line-clamp-1 drop-shadow text-center px-2 font-black text-slate-900">
					{category.name}
				</h3>
			</Link>
		</motion.div>
	);
}


const fadeUp = {
	hidden: { opacity: 0, y: 10 },
	show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
};

export default function CategoryPage() {
	const API_URL = process.env.NEXT_PUBLIC_API_URL;
	const { id } = useParams();
	const categoryId = id as string;
	const { language, t } = useLanguage();

	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState<CategoryData | null>(null);

	const [allProducts, setAllProducts] = useState<ProductI[]>([]);
	const [subCategories, setSubCategories] = useState<CategoryChild[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<ProductI[]>([]);

	// UI state
	const [page, setPage] = useState(1);
	const rowsPerPage = 12;

	const [priceOrder, setPriceOrder] = useState<"" | "asc" | "desc" | "rating">("");
	const [selectedCountry, setSelectedCountry] = useState<string>("");
	const [isDescriptionOpen, setIsDescriptionOpen] = useState<boolean>(true);
	const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
	const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);

	// Countries list
	const countries = [
		{ code: "EG", name: "مصر", flag: "eg" },
		{ code: "SA", name: "السعودية", flag: "sa" },
		{ code: "AE", name: "الإمارات", flag: "ae" },
		{ code: "KW", name: "الكويت", flag: "kw" },
		{ code: "QA", name: "قطر", flag: "qa" },
		{ code: "BH", name: "البحرين", flag: "bh" },
		{ code: "OM", name: "عمان", flag: "om" },
		{ code: "JO", name: "الأردن", flag: "jo" },
		{ code: "LB", name: "لبنان", flag: "lb" },
		{ code: "IQ", name: "العراق", flag: "iq" },
		{ code: "YE", name: "اليمن", flag: "ye" },
		{ code: "SY", name: "سوريا", flag: "sy" },
		{ code: "PS", name: "فلسطين", flag: "ps" },
		{ code: "MA", name: "المغرب", flag: "ma" },
		{ code: "DZ", name: "الجزائر", flag: "dz" },
		{ code: "TN", name: "تونس", flag: "tn" },
		{ code: "LY", name: "ليبيا", flag: "ly" },
		{ code: "SD", name: "السودان", flag: "sd" },
		{ code: "US", name: "الولايات المتحدة", flag: "us" },
		{ code: "GB", name: "المملكة المتحدة", flag: "gb" },
		{ code: "CA", name: "كندا", flag: "ca" },
		{ code: "AU", name: "أستراليا", flag: "au" },
		{ code: "DE", name: "ألمانيا", flag: "de" },
		{ code: "FR", name: "فرنسا", flag: "fr" },
		{ code: "IT", name: "إيطاليا", flag: "it" },
		{ code: "ES", name: "إسبانيا", flag: "es" },
		{ code: "NL", name: "هولندا", flag: "nl" },
		{ code: "BE", name: "بلجيكا", flag: "be" },
		{ code: "CH", name: "سويسرا", flag: "ch" },
		{ code: "AT", name: "النمسا", flag: "at" },
		{ code: "SE", name: "السويد", flag: "se" },
		{ code: "NO", name: "النرويج", flag: "no" },
		{ code: "DK", name: "الدنمارك", flag: "dk" },
		{ code: "FI", name: "فنلندا", flag: "fi" },
		{ code: "PL", name: "بولندا", flag: "pl" },
		{ code: "TR", name: "تركيا", flag: "tr" },
		{ code: "GR", name: "اليونان", flag: "gr" },
		{ code: "PT", name: "البرتغال", flag: "pt" },
		{ code: "IE", name: "أيرلندا", flag: "ie" },
		{ code: "NZ", name: "نيوزيلندا", flag: "nz" },
		{ code: "JP", name: "اليابان", flag: "jp" },
		{ code: "CN", name: "الصين", flag: "cn" },
		{ code: "KR", name: "كوريا الجنوبية", flag: "kr" },
		{ code: "IN", name: "الهند", flag: "in" },
		{ code: "BR", name: "البرازيل", flag: "br" },
		{ code: "MX", name: "المكسيك", flag: "mx" },
		{ code: "AR", name: "الأرجنتين", flag: "ar" },
		{ code: "ZA", name: "جنوب أفريقيا", flag: "za" },
		{ code: "NG", name: "نيجيريا", flag: "ng" },
		{ code: "KE", name: "كينيا", flag: "ke" },
		{ code: "RU", name: "روسيا", flag: "ru" },
	];

	useEffect(() => {
		if (!categoryId) return;

		async function fetchCategoryAndProducts() {
			setLoading(true);
			try {
				const res = await fetch(`${API_URL}/categories/${categoryId}`, {
					headers: {
						'Accept-Language': language
					}
				});
				const result = await res.json();

				if (result.status && result.data) {
					const cat: CategoryData = result.data;
					setCategory(cat);
					setSubCategories(cat.children || []);

					// parent category => fetch children products too
					if (cat.is_parent && cat.children.length > 0) {
						const allProds: ProductI[] = [...(cat.products || [])];

						for (const child of cat.children) {
							try {
								const childRes = await fetch(`${API_URL}/categories/${child.id}`, {
									headers: {
										'Accept-Language': language
									}
								});
								const childData = await childRes.json();
								if (childData.status && childData.data?.products) {
									allProds.push(...childData.data.products);
								}
							} catch (err) {
								console.error(`Error fetching child ${child.id}:`, err);
							}
						}

						const uniqueProducts = Array.from(new Map(allProds.map((p) => [p.id, p])).values());

						setAllProducts(uniqueProducts);
						setFilteredProducts(uniqueProducts);
					} else {
						const prods = cat.products || [];
						setAllProducts(prods);
						setFilteredProducts(prods);
					}
				} else {
					setCategory(null);
				}
			} catch (err) {
				console.error("Error fetching category:", err);
				setCategory(null);
			} finally {
				setLoading(false);
			}
		}

		fetchCategoryAndProducts();
	}, [categoryId, API_URL, language]);

	// Filter by country
	useEffect(() => {
		if (!selectedCountry) {
			setFilteredProducts(allProducts);
			return;
		}

		// Filter products by country (assuming products have a country field or shipping_countries)
		const filtered = allProducts.filter((product) => {
			// Check if product has country-related fields
			const productCountries = (product as any).shipping_countries || (product as any).countries || (product as any).available_countries || [];
			const productCountry = (product as any).country || (product as any).country_code;
			
			// If product has specific countries list, check if selected country is in it
			if (Array.isArray(productCountries) && productCountries.length > 0) {
				return productCountries.includes(selectedCountry) || productCountries.some((c: any) => c.code === selectedCountry || c === selectedCountry);
			}
			
			// If product has a single country field, check if it matches
			if (productCountry) {
				return productCountry === selectedCountry || (typeof productCountry === 'object' && productCountry.code === selectedCountry);
			}
			
			// If no country info, show the product (or hide it - adjust based on requirements)
			return true; // Show products without country info
		});

		setFilteredProducts(filtered);
		setPage(1);
	}, [selectedCountry, allProducts]);

	const sortedProducts = useMemo(() => {
		if (!priceOrder) return filteredProducts;
		const sorted = [...filteredProducts];

		if (priceOrder === "asc" || priceOrder === "desc") {
			sorted.sort((a, b) => {
				const pa = Number(a.final_price ?? a.price ?? 0);
				const pb = Number(b.final_price ?? b.price ?? 0);
				return priceOrder === "asc" ? pa - pb : pb - pa;
			});
		} else if (priceOrder === "rating") {
			sorted.sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0));
		}

		return sorted;
	}, [filteredProducts, priceOrder]);

	const paginatedProducts = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		return sortedProducts.slice(start, start + rowsPerPage);
	}, [sortedProducts, page]);

	const handleFavoriteChange = (productId: number, newValue: boolean) => {
		setAllProducts((prev) =>
			prev.map((p) => (p.id === productId ? { ...p, is_favorite: newValue } : p))
		);
	};

	if (loading) return <CategoryPageSkeleton />;

	if (!category) {
		return (
			<div className="text-center py-20 text-xl text-gray-600" dir="rtl">
				القسم غير موجود
			</div>
		);
	}

	const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6";

	const sortOptions: { label: string; value: "" | "rating" | "asc" | "desc" }[] = [
		{ label: t('featured'), value: "" },
		{ label: t('highest_rated'), value: "rating" },
		{ label: t('price_low_high'), value: "asc" },
		{ label: t('price_high_low'), value: "desc" },
	];


	function getPages(
		current: number,
		total: number,
		range: number = 1 // 👈 reduce this on mobile
	) {
		if (total <= 2 * range + 5) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		const pages: (number | "…")[] = [];
		const left = Math.max(2, current - range);
		const right = Math.min(total - 1, current + range);

		pages.push(1);

		if (left > 2) pages.push("…");

		for (let p = left; p <= right; p++) {
			pages.push(p);
		}

		if (right < total - 1) pages.push("…");

		pages.push(total);

		return pages;
	}


	const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);

	return (
		<section className="">
			{/* Full Width Banner */}
		<div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] mb-3">
  {/* طبقة غامقة فوق الصورة */}
  <div className="absolute inset-0 bg-black/30 z-10"></div>
  
  <Image
    src={category.image || "/images/cover.webp"}
    alt={category.name}
    fill
    className="object-cover"
    priority
  />
  
  {/* Gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-20" />
  
  {/* Breadcrumb */}
  <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-30">
    <div className="container mx-auto px-2 pt-2">
      <nav className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-white/90 flex-wrap">
        <Link href="/" className="hover:text-white transition">
          {t('home')}
        </Link>
        <span className="text-white/60">›</span>
        <Link href="/category" className="hover:text-white transition">
          {t('categories')}
        </Link>
        <span className="text-white/60">›</span>
        <span className="text-white font-semibold line-clamp-1">{category.name}</span>
      </nav>
      <h1 className="text-2xl mt-3 font-black text-white mb-2">{category.name}</h1>
    </div>
  </div>
</div>

			<div className="container px-4 md:px-0 pt-4 md:pt-2 pb-6 md:py-12">
				<div className="flex items-center md:justify-between flex-wrap">
					{/* Header */}
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6">
					<h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 mb-1 md:mb-2">{category.name}</h1>
					{allProducts.length > 0 && (
						<p className="text-xs md:text-sm text-slate-500">
							{t('display')} <span className="font-extrabold text-slate-900">{filteredProducts.length}</span>{" "}
							{t('product_singular')}
						</p>
					)}
				</motion.div>

				{/* Filters and Sort */}
				{allProducts.length > 0 && (
					<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6">
					<div className="flex items-center gap-2 md:gap-2 flex-wrap  md:flex-nowrap">
						{/* Country Filter */}
						<FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160, md: 180  },flexShrink: 0 }}>
							<Select
								value={selectedCountry}
								onChange={(e) => setSelectedCountry(e.target.value)}
								displayEmpty
								IconComponent={KeyboardArrowDownRoundedIcon}
								renderValue={(selected) => {
									if (!selected) return t('all_countries');
									const country = countries.find((c) => c.code === selected);
									return country ? (
										<div className="flex items-center gap-2">
											<span className={`fi fi-${country.flag}`}></span>
											<span>{country.name}</span>
										</div>
									) : t('all_countries');
								}}
								sx={{
									direction: "rtl",
									borderRadius: "14px",
									backgroundColor: "#fff",
									fontWeight: 800,
									fontSize: "0.9rem",
									boxShadow: "0 1px 2px rgba(0,0,0,.06)",
									fontFamily: "Cairo, Cairo Fallback",
									
									"& .MuiSelect-select": {
										padding: "10px 14px 10px 38px",
									},
									"& fieldset": {
										borderColor: "#e2e8f0",
									},
									"&:hover fieldset": {
										borderColor: "#cbd5e1",
									},
									"&.Mui-focused fieldset": {
										borderColor: "#94a3b8",
										boxShadow: "0 0 0 3px rgba(148,163,184,.25)",
									},
									"& .MuiSvgIcon-root": {
										left: 10,
										right: "auto",
										color: "#64748b",
									},
								}}
								MenuProps={{
									PaperProps: {
										sx: {
											mt: 1,
											borderRadius: "14px",
											boxShadow: "0 12px 30px rgba(0,0,0,.12)",
											direction: "rtl",
											fontFamily: "Cairo, Cairo Fallback",
											marginTop: "10%",
											"& .MuiMenuItem-root": {
												fontWeight: 700,
												fontSize: "0.9rem",
												borderRadius: "10px",
												mx: 1,
												my: 0.5,
											},
											"& .Mui-selected": {
												backgroundColor: "#0f172a !important",
												color: "#fff",
											},
										},
									},
								}}
							>
								<MenuItem value="">
									<em>{t('all_countries')}</em>
								</MenuItem>
								{countries.map((country) => (
									<MenuItem key={country.code} value={country.code}>
										<div className="flex items-center gap-2">
											<span className={`fi fi-${country.flag}`}></span>
											<span>{country.name}</span>
										</div>
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{/* Sort (enhanced select) */}
							<FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160, md: 180 }, flexShrink: 0 }}>
								<Select
									value={priceOrder}
									onChange={(e) => setPriceOrder(e.target.value as any)}
									displayEmpty
									IconComponent={KeyboardArrowDownRoundedIcon}
									renderValue={(selected) =>
										sortOptions.find((o) => o.value === selected)?.label ||
										t('default_sort')
									}
									sx={{
										direction: "rtl",
										borderRadius: "14px",
										backgroundColor: "#fff",
										fontWeight: 800,
										fontSize: "0.9rem",
										boxShadow: "0 1px 2px rgba(0,0,0,.06)",
										fontFamily: "Cairo, Cairo Fallback",
										// input padding (leave space for icon on LEFT)
										"& .MuiSelect-select": {
											padding: "10px 14px 10px 38px", // left space for arrow
										},

										// border
										"& fieldset": {
											borderColor: "#e2e8f0",
										},
										"&:hover fieldset": {
											borderColor: "#cbd5e1",
										},
										"&.Mui-focused fieldset": {
											borderColor: "#94a3b8",
											boxShadow: "0 0 0 3px rgba(148,163,184,.25)",
										},

										// 🔽 move arrow to LEFT
										"& .MuiSvgIcon-root": {
											left: 10,
											right: "auto",
											color: "#64748b",
										},
									}}
									MenuProps={{
										PaperProps: {
											sx: {
												mt: 1,
												borderRadius: "14px",
												boxShadow: "0 12px 30px rgba(0,0,0,.12)",
												direction: "rtl",
												fontFamily: "Cairo, Cairo Fallback",
												"& .MuiMenuItem-root": {
													fontWeight: 700,
													fontSize: "0.9rem",
													borderRadius: "10px",
													mx: 1,
													my: 0.5,
												},
												"& .Mui-selected": {
													backgroundColor: "#0f172a !important",
													color: "#fff",
												},
											},
										},
									}}
								>
									{sortOptions.map((o) => (
										<MenuItem className="font-ar" key={o.value} value={o.value}>
											{o.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
					</div>
				</motion.div>
				)}
				</div>

				{/* Products and Description Row */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
					{/* Description, Instructions, Terms - 3 columns */}
					<div className="lg:col-span-3 space-y-3 md:space-y-4 lg:sticky lg:top-[160px] order-1 lg:order-1">
						{/* Description */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
							<button
								onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
								className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
								aria-label="Toggle description"
							>
									<div className="flex items-center gap-2">
										<Package className="w-5 h-5 text-pro-max shrink-0" />
										<h3 className="text-sm font-extrabold text-slate-900">{t('description')}</h3>
									</div>
								<motion.span
									animate={{ rotate: isDescriptionOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-6 w-6 rounded-lg text-slate-600 shrink-0"
								>
									<ChevronDown className="w-4 h-4" />
								</motion.span>
							</button>
							<AnimatePresence initial={false}>
								{isDescriptionOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
									<div className="px-3 md:px-4 pb-3 md:pb-4">
										{category.description ? (
											<div className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: category.description }} />
										) : (
											<p className="text-xs md:text-sm text-slate-500">{t('no_description_available')}</p>
										)}
									</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Instructions */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
							<button
								onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
								className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
								aria-label="Toggle instructions"
							>
									<div className="flex items-center gap-2">
										<BookOpen className="w-5 h-5 text-pro-max shrink-0" />
										<h3 className="text-sm font-extrabold text-slate-900">{t('instructions')}</h3>
									</div>
								<motion.span
									animate={{ rotate: isInstructionsOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-6 w-6 rounded-lg text-slate-600 shrink-0"
								>
									<ChevronDown className="w-4 h-4" />
								</motion.span>
							</button>
							<AnimatePresence initial={false}>
								{isInstructionsOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
									<div className="px-3 md:px-4 pb-3 md:pb-4">
										{category.instructions ? (
											<div className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: category.instructions }} />
										) : (
											<p className="text-xs md:text-sm text-slate-500">{t('no_instructions_available')}</p>
										)}
									</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Terms */}
						<div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
							<button
								onClick={() => setIsTermsOpen(!isTermsOpen)}
								className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
								aria-label="Toggle terms"
							>
									<div className="flex items-center gap-2">
										<FileText className="w-5 h-5 text-pro-max shrink-0" />
										<h3 className="text-sm font-extrabold text-slate-900">{t('terms_conditions')}</h3>
									</div>
								<motion.span
									animate={{ rotate: isTermsOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-6 w-6 rounded-lg text-slate-600 shrink-0"
								>
									<ChevronDown className="w-4 h-4" />
								</motion.span>
							</button>
							<AnimatePresence initial={false}>
								{isTermsOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
									<div className="px-3 md:px-4 pb-3 md:pb-4">
										{category.terms ? (
											<div className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: category.terms }} />
										) : (
											<p className="text-xs md:text-sm text-slate-500">{t('no_terms_available')}</p>
										)}
									</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>
					
					<div className="lg:col-span-9 order-2 lg:order-2">
						{/* Sub categories row (only if we have products) */}
						{subCategories.length > 0 && allProducts.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-4 md:mb-6"
							>
								<div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
									{subCategories.map((sub) => (
										<a
											href={`/category/${sub.slug ?? sub.id}`}
											key={sub.id}
											className="min-w-fit group"
										>
											<div className="flex flex-col items-center gap-2">
												<div className="relative w-[70px] h-[70px] rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm group-hover:shadow transition">
													<Image
														src={sub.image || "/images/o1.jpg"}
														alt={sub.name}
														fill
														className="object-cover group-hover:scale-[1.06] transition duration-300"
													/>
												</div>
												<p className="text-xs font-extrabold text-slate-700 group-hover:text-pro transition line-clamp-1 w-[90px] text-center">
													{sub.name}
												</p>
											</div>
										</a>
									))}
								</div>
							</motion.div>
						)}

						{/* Products or Sub-categories Grid */}
						{paginatedProducts.length === 0 ? (
							subCategories.length > 0 ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
									{subCategories.map((sub, idx) => (
										<motion.div
											key={sub.id}
											variants={fadeUp}
											initial="hidden"
											animate="show"
											custom={idx}
										>
											<CategoryCard category={sub} />
										</motion.div>
									))}
								</div>
							) : (
								<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-6 md:p-10 text-center w-full">
									<p className="text-slate-700 font-extrabold text-base md:text-lg">{t('no_products')}</p>
								</motion.div>
							)
						) : (
							<motion.div
								layout
								className={gridClass}
							>
								{paginatedProducts.map((product, idx) => (
									<motion.div
										key={product.id}
										layout
										variants={fadeUp}
										initial="hidden"
										animate="show"
										exit={{ opacity: 0, scale: 0.98 }}
										custom={idx}
									>
										<ProductCard
												id={product.id}
												name={product.name}
												product={product}
												image={product.image || "/images/c1.png"}
												images={
													product.images?.length
														? product.images
														: [{ url: "/images/c1.png", alt: "default" }]
												}
												price={(product.price ?? 1).toString()}
												final_price={product.final_price}
												discount={
													product.discount
														? { value: product.discount.value.toString(), type: product.discount.type }
														: null
												}
												stock={product.stock || 0}
												average_rating={product.average_rating}
												reviews={product.reviews}
												is_favorite={product.is_favorite}
												onFavoriteChange={handleFavoriteChange}
												className2="hidden"
												Bottom="bottom-41.5"
											/>
									</motion.div>
								))}
							</motion.div>
						)}

						{/* Pagination (simple + nice) */}

						{sortedProducts.length > rowsPerPage && (
							<div className="mt-6 md:mt-10 flex items-center justify-center overflow-x-auto">
								<div
									className="flex items-center gap-1 rounded-lg md:rounded-xl border border-slate-200 bg-white 
                 px-2 py-1.5 shadow-sm
                 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2"
								>
									{/* Prev */}
									<button
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className="inline-flex items-center gap-1 rounded-lg 
                   px-2 py-1.5 text-xs font-extrabold text-slate-700
                   hover:bg-slate-50 disabled:opacity-40 transition
                   sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
										aria-label={t('previous')}
									>
										<ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									</button>

									<div className="h-5 w-px bg-slate-200 mx-0.5 sm:h-6 sm:mx-1" />

									{/* Page numbers */}
									<div className="flex items-center gap-0.5 sm:gap-1">
										{getPages(page, totalPages, 0).map((p, idx) =>
											p === "…" ? (
												<span
													key={`dots-${idx}`}
													className="px-1 text-xs font-extrabold text-slate-400 sm:px-2 sm:text-sm"
												>
													…
												</span>
											) : (
												<motion.button
													key={p}
													whileHover={{ scale: 1.03 }}
													whileTap={{ scale: 0.98 }}
													onClick={() => setPage(p)}
													className={[
														"min-w-[30px] h-[30px] rounded-lg px-1 text-xs font-black transition",
														"sm:min-w-[38px] sm:h-[38px] sm:rounded-xl sm:px-2 sm:text-sm",
														p === page
															? "bg-[#14213d] text-white shadow"
															: "text-slate-700 hover:bg-slate-50",
													].join(" ")}
													aria-current={p === page ? "page" : undefined}
													aria-label={`${t('page_singular')} ${p}`}
												>
													{p}
												</motion.button>
											)
										)}
									</div>

									<div className="h-5 w-px bg-slate-200 mx-0.5 sm:h-6 sm:mx-1" />

									{/* Next */}
									<button
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page >= totalPages}
										className="inline-flex items-center gap-1 rounded-lg 
                   px-2 py-1.5 text-xs font-extrabold text-slate-700
                   hover:bg-slate-50 disabled:opacity-40 transition
                   sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
										aria-label={t('next')}
									>
										<ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									</button>
								</div>
							</div>
						)}
					</div>

					
				</div>
			</div>
		</section>
	);
}


