"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type SliderItem = {
  id?: number;
  image?: string;
  mobile_image?: string | null;
  alt?: string;
  order?: number;
  is_active?: boolean;
  is_link_active?: boolean;
  link_url?: string;
  link_target?: string;
};

type SliderResponse = {
  items?: SliderItem[];
} | null;

export default function SliderComponent({ src }: { src: SliderResponse | null }) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const [swiperReady, setSwiperReady] = useState(0);

  const items = useMemo(() => {
    const list = src?.items ?? [];
    return list
      .filter((it) => Boolean(it?.mobile_image || it?.image))
      .filter((it) => it?.is_active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [src]);

  const hasSlides = items.length > 0;
  const showNav = items.length > 1;
  const showPagination = items.length > 1;

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !showNav || !prevRef.current || !nextRef.current) return;

    const navigationParams = swiper.params.navigation;
    if (!navigationParams || navigationParams === true) return;

    navigationParams.prevEl = prevRef.current;
    navigationParams.nextEl = nextRef.current;

    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, [showNav, swiperReady]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !showPagination || !paginationRef.current) return;

    const paginationParams = swiper.params.pagination;
    if (!paginationParams || paginationParams === true) return;

    paginationParams.el = paginationRef.current;
    paginationParams.clickable = true;
    paginationParams.renderBullet = (_index, className) =>
      `<span class="${className} inline-block h-2.5 w-2.5 rounded-full bg-white/60 transition-all duration-300 md:h-3 md:w-3"></span>`;

    swiper.pagination.destroy();
    swiper.pagination.init();
    swiper.pagination.render();
    swiper.pagination.update();
  }, [showPagination, swiperReady]);

  if (!hasSlides) return null;

  return (
    <div className="relative w-full h-[200px] md:h-[420px] group">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        loop={items.length > 1}
        autoplay={items.length > 1 ? { delay: 3200, disableOnInteraction: false } : false}
        allowTouchMove
        grabCursor
        observer
        observeParents
        watchOverflow
        onSwiper={(swiperInstance) => {
          swiperRef.current = swiperInstance;
          setSwiperReady((value) => value + 1);
        }}
        navigation={false}
        pagination={false}
        className="w-full h-full"
      >
        {items.map((item, index: number) => {
          const href = item?.is_link_active === false ? "/" : item?.link_url || "/";
          const target = item?.link_target || "_self";
          const alt = item?.alt || `Slide ${index + 1}`;

          return (
            <SwiperSlide key={item.id ?? index}>
              <div className="relative w-full h-[200px] md:h-[420px] overflow-hidden">
                <Link href={href} target={target} aria-label={`Go to slide ${index + 1}`} className="block h-full w-full">
                  <img
                    src={item.mobile_image || item.image || ""}
                    alt={alt}
                    className="object-fill w-full h-full"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                </Link>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {showNav && (
        <>
          <button
            ref={prevRef}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 
                     w-11 h-11 md:w-12 md:h-12 rounded-full 
                     bg-white/90 backdrop-blur-sm
                     border border-gray-200/80
                     shadow-[0_8px_24px_rgba(0,0,0,0.15)]
                     flex items-center justify-center
                     transition-all duration-250 
                     hover:bg-white hover:scale-105 hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]
                     active:scale-95"
            aria-label="Previous slide"
          >
            <svg 
              className="w-5 h-5 md:w-6 md:h-6 text-gray-800" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            ref={nextRef}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20
                     w-11 h-11 md:w-12 md:h-12 rounded-full
                     bg-white/90 backdrop-blur-sm
                     border border-gray-200/80
                     shadow-[0_8px_24px_rgba(0,0,0,0.15)]
                     flex items-center justify-center
                     transition-all duration-250
                     hover:bg-white hover:scale-105 hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]
                     active:scale-95"
            aria-label="Next slide"
          >
            <svg 
              className="w-5 h-5 md:w-6 md:h-6 text-gray-800" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {showPagination && (
        <div
          ref={paginationRef}
          className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 md:gap-2 z-20"
        />
      )}
    </div>
  );
}
