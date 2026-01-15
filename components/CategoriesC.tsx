"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryI } from "@/Types/CategoriesI";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

interface CategoriesSliderProps {
	categories: CategoryI[];
	title?: string;
	subtitle?: string;
	inSlide?: any;
}

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

export default function CategoriesSlider({
	categories,
	inSlide,
	title = "الأقسام",
	subtitle = "اختر القسم اللي يناسبك",
}: CategoriesSliderProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollStart, setCanScrollStart] = useState(false);
	const [canScrollEnd, setCanScrollEnd] = useState(false);
	
	// Get direction from LanguageContext - updates automatically when language changes
	const { direction } = useLanguage();
	const isRTL = direction === 'rtl';

	const items = useMemo(() => categories ?? [], [categories]);
	// Limit to 8 items for display
	const displayedItems = useMemo(() => items.slice(0, 12), [items]);
	const hasSlides = displayedItems.length > 0;
	if (!hasSlides) return null;

	const checkScrollability = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const { scrollLeft, scrollWidth, clientWidth } = container;
		
		// Use a small threshold to handle rounding issues
		const threshold = 1;
		const maxScroll = Math.max(0, scrollWidth - clientWidth);
		
		if (isRTL) {
			// In RTL: scrollLeft can be negative or positive depending on browser
			// We need to handle both cases
			const currentScroll = scrollLeft < 0 ? Math.abs(scrollLeft) : scrollLeft;
			
			// Can scroll towards start (right visually) if not at start
			setCanScrollStart(currentScroll > threshold || scrollLeft < 0);
			
			// Can scroll towards end (left visually) if not at end
			setCanScrollEnd(currentScroll < maxScroll - threshold && maxScroll > 0);
		} else {
			// In LTR: scrollLeft is always positive (0 to maxScroll)
			// Can scroll towards start (left) if scrollLeft > 0
			setCanScrollStart(scrollLeft > threshold);
			
			// Can scroll towards end (right) if scrollLeft < maxScroll
			setCanScrollEnd(scrollLeft < maxScroll - threshold && maxScroll > 0);
		}
	};

	useEffect(() => {
		// Initial check with a small delay to ensure DOM is ready
		const timer = setTimeout(() => {
			checkScrollability();
		}, 100);
		
		const container = scrollContainerRef.current;
		if (container) {
			// Check on scroll
			container.addEventListener("scroll", checkScrollability);
			// Check on resize
			window.addEventListener("resize", checkScrollability);
			
			return () => {
				clearTimeout(timer);
				container.removeEventListener("scroll", checkScrollability);
				window.removeEventListener("resize", checkScrollability);
			};
		}
		
		return () => clearTimeout(timer);
	}, [items, isRTL]);

	// Scroll towards start (left in LTR, right in RTL)
	const scrollStart = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		
		if (isRTL) {
			// In RTL: scroll towards start means scroll right visually (increase scrollLeft)
			container.scrollBy({ left: 250, behavior: "smooth" });
		} else {
			// In LTR: scroll towards start means scroll left (decrease scrollLeft)
			const currentScroll = container.scrollLeft;
			const newScroll = Math.max(0, currentScroll - 250);
			container.scrollTo({ left: newScroll, behavior: "smooth" });
		}
		
		// Re-check scrollability after scroll animation
		setTimeout(() => checkScrollability(), 350);
	};

	// Scroll towards end (right in LTR, left in RTL)
	const scrollEnd = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const { scrollWidth, clientWidth } = container;
		const maxScroll = Math.max(0, scrollWidth - clientWidth);
		
		if (isRTL) {
			// In RTL: scroll towards end means scroll left visually (decrease scrollLeft)
			container.scrollBy({ left: -250, behavior: "smooth" });
		} else {
			// In LTR: scroll towards end means scroll right (increase scrollLeft)
			const currentScroll = container.scrollLeft;
			const newScroll = Math.min(maxScroll, currentScroll + 250);
			container.scrollTo({ left: newScroll, behavior: "smooth" });
		}
		
		// Re-check scrollability after scroll animation
		setTimeout(() => checkScrollability(), 350);
	};

	return (
		<section className="relative w-full py-4 md:py-6 ">
			{/* Header */}
			<div className="mb-3 md:mb-4 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"grid h-9 w-9 place-items-center rounded-2xl",
							"bg-slate-50 border border-slate-200 text-slate-700"
						)}
						aria-hidden="true"
					>
						<Sparkles className="h-5 w-5 text-pro-max" />
					</span>
					<div>
						<h2 className="text-base md:text-lg font-extrabold text-slate-900">
							{title}
						</h2>
						{/* {subtitle && (
							<p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>
						)} */}
					</div>
				</div>
				{items.length > 12 && (
					<Link
						href="/category"
						className="text-pro-max text-sm md:text-base font-semibold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition whitespace-nowrap"
					>
						عرض الكل
					</Link>
				)}
			</div>

			{/* Categories Container with Arrows */}
			<div className="relative flex items-center gap-2">
				{/* Start Arrow (Left in LTR, Right in RTL) */}
				<button
					type="button"
					aria-label={isRTL ? "التالي" : "السابق"}
					onClick={scrollStart}
					disabled={!canScrollStart}
					className={cn(
						"flex-shrink-0 h-10 w-10 rounded-2xl border shadow-sm grid place-items-center transition",
						"bg-white border-slate-200 text-slate-700",
						!canScrollStart ? "opacity-0 " : "hover:text-orange-500"
					)}
				>
					{isRTL ? (
						<ChevronRight className="h-5 w-5" />
					) : (
						<ChevronLeft className="h-5 w-5" />
					)}
					
				</button>

				{/* Categories Scrollable Container */}
				<div
					ref={scrollContainerRef}
					id="all_cate"
					dir={isRTL ? "rtl" : "ltr"}
					className="flex-1 flex overflow-x-auto gap-1 scrollbar-light scroll-smooth"
					onScroll={checkScrollability}
				>
					{displayedItems.map((cat) => (
					<div key={cat.id} className="flex-shrink-0 m-1 md:m-2">
						<Link
							href={`/category/${cat.id}`}
							aria-label={`Go to ${cat.name}`}
							className="fast-buy-item py-0"
						>
							<div
								className={cn(
									"group flex flex-col items-center justify-between gap-2 p-3 md:p-4",
									"rounded-lg md:rounded-xl overflow-hidden",
									"shadow-md hover:shadow-lg",
									"transition-all duration-300",
									"md:w-[170px] md:h-[103px] w-[150px] h-[83px] "
								)}
							>
								{/* Category Image */}
								<div
									className={cn(
										"relative w-full flex-1",
										"rounded-md overflow-hidden"
									)}
								>
									<Image
										src={cat.image || "/images/cat1.png"}
										alt={cat.name}
										fill
										sizes="(max-width: 768px) 80px, 112px"
										className="object-cover transition duration-300 group-hover:scale-[1.06]"
									/>
									{/* overlay gradient */}
									<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
								</div>

								{/* Category Name */}
								<p className="text-[11px] md:text-[13px] font-extrabold text-slate-700 text-center leading-tight line-clamp-2 group-hover:text-pro transition px-1 flex-shrink-0">
									{cat.name}
								</p>
							</div>
						</Link>
					</div>
					))}
				</div>

				{/* End Arrow (Right in LTR, Left in RTL) */}
				<button
					type="button"
					aria-label={isRTL ? "السابق" : "التالي"}
					onClick={scrollEnd}
					disabled={!canScrollEnd}
					className={cn(
						"flex-shrink-0 h-10 w-10 rounded-2xl border shadow-sm grid place-items-center transition",
						"bg-white border-slate-200 text-slate-700",
						!canScrollEnd ? "opacity-0 " : "hover:text-orange-500"
					)}
				>
					{isRTL ? (
						<ChevronLeft className="h-5 w-5" />
					) : (
						<ChevronRight className="h-5 w-5" />
					)}
				</button>
			</div>
		</section>
	);
}
