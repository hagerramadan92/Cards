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
	  onCategoryClick?: () => void;
	 parentCategoryId?: number; 
  parentCategorySlug?: string; 
}

function cn(...c: (string | false | undefined | null)[]) {
	return c.filter(Boolean).join(" ");
}

export default function CategoriesSlider({
	categories,
	inSlide,
	title,
	subtitle,
	onCategoryClick ,
	parentCategoryId, // ✅ يجب إضافته هنا
	parentCategorySlug // ✅ يجب إضافته هنا
}: CategoriesSliderProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollStart, setCanScrollStart] = useState(false);
	const [canScrollEnd, setCanScrollEnd] = useState(false);
	
	// Drag to scroll state
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeftState, setScrollLeftState] = useState(0);
	const [dragStartTime, setDragStartTime] = useState(0);
	
	// Get direction from LanguageContext - updates automatically when language changes
	const { direction, t } = useLanguage();
	const isRTL = direction === 'rtl';

	// Items logic
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
			const currentScroll = scrollLeft < 0 ? Math.abs(scrollLeft) : scrollLeft;
			
			// Can scroll towards start (right visually) if not at start
			setCanScrollStart(currentScroll > threshold || scrollLeft < 0);
			
			// Can scroll towards end (left visually) if not at end
			setCanScrollEnd(currentScroll < maxScroll - threshold && maxScroll > 0);
		} else {
			// In LTR: scrollLeft is always positive (0 to maxScroll)
			setCanScrollStart(scrollLeft > threshold);
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
			container.addEventListener("scroll", checkScrollability);
			window.addEventListener("resize", checkScrollability);
			
			return () => {
				clearTimeout(timer);
				container.removeEventListener("scroll", checkScrollability);
				window.removeEventListener("resize", checkScrollability);
			};
		}
		
		return () => clearTimeout(timer);
	}, [items, isRTL]);

	// Scroll handlers
	const scrollStart = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		
		if (isRTL) {
			container.scrollBy({ left: 250, behavior: "smooth" });
		} else {
			const currentScroll = container.scrollLeft;
			const newScroll = Math.max(0, currentScroll - 250);
			container.scrollTo({ left: newScroll, behavior: "smooth" });
		}
		
		setTimeout(() => checkScrollability(), 350);
	};

	const scrollEnd = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const { scrollWidth, clientWidth } = container;
		const maxScroll = Math.max(0, scrollWidth - clientWidth);
		
		if (isRTL) {
			container.scrollBy({ left: -250, behavior: "smooth" });
		} else {
			const currentScroll = container.scrollLeft;
			const newScroll = Math.min(maxScroll, currentScroll + 250);
			container.scrollTo({ left: newScroll, behavior: "smooth" });
		}
		
		setTimeout(() => checkScrollability(), 350);
	};

	// Drag handlers
	const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		const container = scrollContainerRef.current;
		if (!container) return;
		
		// Only handle primary mouse button (left click)
		if (e.button !== 0) return;
		
		// Disable smooth scroll during drag
		container.style.scrollBehavior = "auto";
		setIsDragging(true);
		setStartX(e.pageX - container.offsetLeft);
		setScrollLeftState(container.scrollLeft);
		setDragStartTime(Date.now());
		
		// Prevent default to avoid text selection
		e.preventDefault();
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		
		e.preventDefault();
		
		const container = scrollContainerRef.current;
		if (!container) return;
		
		const x = e.pageX - container.offsetLeft;
		const walk = (x - startX) * 2; // Scroll speed multiplier
		container.scrollLeft = scrollLeftState - walk;
	};

	const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDragging) {
			if (scrollContainerRef.current) {
				scrollContainerRef.current.style.scrollBehavior = "smooth";
			}
			return;
		}
		
		setIsDragging(false);
		
		if (scrollContainerRef.current) {
			scrollContainerRef.current.style.scrollBehavior = "smooth";
		}
	};

	const handleMouseLeave = () => {
		if (isDragging) {
			setIsDragging(false);
			if (scrollContainerRef.current) {
				scrollContainerRef.current.style.scrollBehavior = "smooth";
			}
		}
	};

	const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, catId: number) => {
		// Prevent click if we were dragging (based on time and movement)
		const dragDuration = Date.now() - dragStartTime;
		const hasSignificantMovement = Math.abs(scrollLeftState - (scrollContainerRef.current?.scrollLeft || 0)) > 5;
		
		if (isDragging || (dragDuration > 100 && hasSignificantMovement)) {
			e.preventDefault();
		}
	};

	return (
		<section className="relative w-full py-4 md:py-6 " onClick={onCategoryClick}>
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
							 {title || t('category')} 
						</h2>
					</div>
				</div>
				{items.length > 5 && (
					<Link
						 href={parentCategoryId 
      ? `/category/${parentCategoryId}` 
      : "/categories"}
    onClick={onCategoryClick}
						className="text-pro-max text-sm md:text-base font-semibold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition whitespace-nowrap"
					>
						{t('view_all')}
					</Link>
				)}
			</div>

			{/* Categories Container with Arrows */}
			<div className="relative flex items-center gap-2">
				{/* Start Arrow */}
				<button
					type="button"
					aria-label={isRTL ? t('next') : t('previous')}
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

				{/* Categories Scrollable Container - Now Draggable */}
				<div
					ref={scrollContainerRef}
					id="all_cate"
					dir={isRTL ? "rtl" : "ltr"}
					className={cn(
						"flex-1 flex overflow-x-auto gap-1 scrollbar-light cursor-grab active:cursor-grabbing",
						"select-none" // Prevent text selection while dragging
					)}
					style={{
						scrollbarWidth: 'thin',
						WebkitOverflowScrolling: 'touch',
					}}
					onScroll={checkScrollability}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseLeave}
				>
					{displayedItems.map((cat) => (
						<div key={cat.id} className="flex-shrink-0 m-1 md:m-2">
							<Link
								href={`/category/${cat.id}`}
								aria-label={`Go to ${cat.name}`}
								className="fast-buy-item py-0 block"
								onClick={(e) => {
									handleLinkClick(e, cat.id);
									onCategoryClick?.();
								}}
								draggable={false} // Prevent default drag behavior
							>
								<div
									className={cn(
										"group flex flex-col items-center justify-between gap-2 p-2",
										"rounded-lg md:rounded-xl overflow-hidden",
										"shadow-md hover:shadow-lg",
										"transition-all duration-300",
										"md:w-[170px] md:h-[103px] w-[150px] h-[83px]"
									)}
								>
									{/* Category Image */}
									<div
										className={cn(
											"relative border-box flex-1 w-[140px] h-[48px]",
											"rounded-md overflow-hidden"
										)}
									>
										<Image
											src={cat.image || "/images/cat1.png"}
											alt={cat.name}
											fill
											sizes="(max-width: 768px) 140px, 140px"
											className="object-contain transition duration-300 group-hover:scale-[1.06] w-[140px] h-[48px]"
											draggable={false}
										/>
										{/* overlay gradient */}
										<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
									</div>

									{/* Category Name */}
									<p className="text-[11px] md:text-[13px] font-extrabold pb-1 sm:pb-2 text-slate-700 text-center leading-tight line-clamp-2 group-hover:text-pro transition px-1 flex-shrink-0">
										{cat.name.length > 15 ? `${cat.name.substring(0, 15)}...` : cat.name}
									</p>
								</div>
							</Link>
						</div>
					))}
				</div>

				{/* End Arrow */}
				<button
					type="button"
					aria-label={isRTL ? t('previous') : t('next')}
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