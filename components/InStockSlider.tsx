"use client";

import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { ProductI } from "@/Types/ProductsI";
import { useLanguage } from "@/src/context/LanguageContext";
import Spinner from "./Spinner/spinner";

interface InStockSliderProps {
	inStock: ProductI[];
	CardComponent: (product: ProductI) => React.ReactNode;
	title?: string;
	hiddenArrow?: boolean;
	isLoading?: boolean;
	skeletonCount?: number;
}

export default function InStockSlider({
	inStock,
	CardComponent,
	title = "",
	isLoading = false,
	skeletonCount = 8,
	hiddenArrow = true
}: InStockSliderProps) {
	const prevRef = useRef<HTMLButtonElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);
	const swiperRef = useRef<SwiperType | null>(null);
	const [swiperReady, setSwiperReady] = useState(0);
	const { t } = useLanguage();

	useEffect(() => {
		const swiper = swiperRef.current;
		if (!swiper || !prevRef.current || !nextRef.current) return;

		const navigationParams = swiper.params.navigation;
		if (!navigationParams || navigationParams === true) return;

		navigationParams.prevEl = prevRef.current;
		navigationParams.nextEl = nextRef.current;

		swiper.navigation.destroy();
		swiper.navigation.init();
		swiper.navigation.update();
	}, [inStock.length, swiperReady]);

	return (
		<div className="relative w-full ">
			{/* Header optional */}
			{title ? (
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg md:text-xl font-extrabold text-gray-900">
						{title}
					</h2>

					{hiddenArrow && <div className="flex items-center gap-2">
						<button
							ref={nextRef}
							className="w-9 h-9 rounded-full border flex items-center justify-center transition"
							style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
							aria-label={t('next')}
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
						<button
							ref={prevRef}
							className="w-9 h-9 rounded-full border flex items-center justify-center transition"
							style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
							aria-label={t('previous')}
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>


					</div>}
				</div>
			) : (
				hiddenArrow &&  <div className="flex justify-end gap-2 mb-3">
					<button
						ref={prevRef}
						className="w-9 h-9 rounded-full border flex items-center justify-center transition"
						style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
						aria-label={t('previous')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						ref={nextRef}
						className="w-9 h-9 rounded-full border flex items-center justify-center transition"
						style={{ background: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
						aria-label={t('next')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			)}

			<Swiper
				className={hiddenArrow === false ? "mt-3" : ""}
				modules={[Navigation]}
				onSwiper={(swiperInstance) => {
					swiperRef.current = swiperInstance;
					setSwiperReady((value) => value + 1);
				}}
				navigation={false}
				spaceBetween={10}
				slidesPerView={2}
				slidesPerGroup={2}
				breakpoints={{
					480: { slidesPerView: 2, slidesPerGroup: 2 , spaceBetween: 0},
					640: { slidesPerView: 2, slidesPerGroup: 2  },
					768: { slidesPerView: 3, slidesPerGroup: 3},
					1024: { slidesPerView: 4, slidesPerGroup: 4 },
					1280: { slidesPerView: 5, slidesPerGroup: 5 },
				}}
			>
				{isLoading
					? Array.from({ length: skeletonCount }).map((_, index) => (
						<SwiperSlide key={`skeleton-${index}`}>
							<div className="flex h-40 w-full items-center justify-center rounded-2xl border border-white/8 bg-white/4">
								<Spinner size="lg" />
							</div>
						</SwiperSlide>
					))
					: inStock.map((product) => (
						<SwiperSlide key={product.id} id="swiper-width" >
							{CardComponent(product)}
						</SwiperSlide>
					))}
			</Swiper>
		</div>
	);
}
