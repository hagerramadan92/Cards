"use client";

import dynamic from "next/dynamic";
import CategoriesSlider from "@/components/CategoriesC";
import InStockSlider from "@/components/InStockSlider";
import ProductCard from "@/components/ProductCard";
import { fetchApi, fetchApi2 } from "@/lib/api";
import { useAppContext } from "@/src/context/AppContext";
import { BannerI } from "@/Types/BannerI";
import { CategoryBannerI } from "@/Types/CategoryBannerI";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/src/context/LanguageContext";

// ✅ Spinner component
import Spinner from "@/components/Spinner/spinner";

// Lazy-load heavy/below-fold components
const SliderComponent = dynamic(
  () => import("@/components/SliderComponent"),
  { 
    loading: () => (
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ), 
    ssr: false 
  }
);

const FastBuy = dynamic(
  () => import("@/components/HomeSection/FastBuy").then((m) => m.default),
  { ssr: false }
);

export default function Home() {
  const { 
    homeData, 
    loadingCategories, 
    parentCategories, 
    loadingHome, 
    appear_in_home_categories,
    
  } = useAppContext();
  
  const { t, language } = useLanguage();

  const [isInitialDataReady, setIsInitialDataReady] = useState(false);
  
  const [isFastBuyReady, setIsFastBuyReady] = useState(false);
  
  const [categories2, setCategories2] = useState<any[]>([]);
  const [paginationState, setPaginationState] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [appear_in_home_categories2, setAppear_in_home_categories2] = useState<any[]>([]);
  
  const [mainSlider, setMainSlider] = useState<BannerI[]>([]);
  const [isMainSliderLoading, setIsMainSliderLoading] = useState(false); // false لأن السلايدر ليس ضرورياً للصفحة الرئيسية

  useEffect(() => {
    if (parentCategories && parentCategories.length > 0 && !isFastBuyReady) {
      setIsFastBuyReady(true);
    }
  }, [parentCategories, isFastBuyReady]);

  useEffect(() => {
    const isReady = !loadingHome && homeData;
    
    if (isReady && !isInitialDataReady) {
      setIsInitialDataReady(true);
    }
  }, [loadingHome, homeData, isInitialDataReady]);

  useEffect(() => {
    if (homeData) {
      const newCategories = homeData?.sub_categories || [];
      const newPagination = homeData?.sub_categories_pagination || null;
      const newAppearCats = homeData?.appear_in_home_categories || [];
      
      setCategories2(newCategories);
      setPaginationState(newPagination);
      setAppear_in_home_categories2(newAppearCats);
    }
  }, [homeData]);

  const loadMore = useCallback(async () => {
    if (!paginationState?.next_page || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextUrl = String(paginationState.next_page);
      const res = await fetchApi2(nextUrl);

      const newCats = res?.data?.sub_categories ?? res?.sub_categories ?? [];
      const newPagination =
        res?.data?.sub_categories_pagination ??
        res?.sub_categories_pagination ??
        res?.pagination ??
        null;

      setCategories2(prev => {
        const merged = [...prev, ...(Array.isArray(newCats) ? newCats : [])];
        const map = new Map(merged.map((c: any) => [c.id, c]));
        return Array.from(map.values());
      });

      setPaginationState(newPagination);
    } catch (e) {
      console.error("Error loading more:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [paginationState?.next_page, loadingMore]);

  const hasNext = Boolean(paginationState?.next_page);

  useEffect(() => {
    let mounted = true;

    const getMainSlider = async () => {
      setIsMainSliderLoading(true);
      try {
        const data = await fetchApi("banners?type=main_slider",);
        if (!mounted) return;
        setMainSlider(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        setMainSlider([]);
      } finally {
        if (mounted) {
          setIsMainSliderLoading(false);
        }
      }
    };

    const timer = setTimeout(getMainSlider, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [language]);

  const sliderSrc = useMemo(
    () => (mainSlider?.[0]?.items || []).map((i) => i.image),
    [mainSlider]
  );

  if (loadingHome && !homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="!mt-8 !mb-8">
      <div className="flex flex-col gap-8">
        <div className="relative rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm">
          {isMainSliderLoading ? (
            <div className="h-[200px] md:h-[420px] flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : sliderSrc.length > 0 ? (
            <SliderComponent src={mainSlider?.[0]} />
          ) : (
            <div className="h-[200px] md:h-[420px] flex items-center justify-center text-gray-400">
              {t('no_categories')}
            </div>
          )}
        </div>

        <div className="md:flex hidden">
          {isFastBuyReady ? (
            <FastBuy categories={parentCategories} />
          ) : (
            <div className="w-full h-24 bg-gray-100 animate-pulse rounded-xl"></div>
          )}
        </div>

        {/* Popular Categories */}
        <div className="container max-md:overflow-hidden w-full pt-8 mt-20">
          {!isInitialDataReady || loadingCategories || parentCategories.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Spinner size="lg" />
            </div>
          ) : (
            <CategoriesSlider 
              categories={parentCategories} 
              title={t('popular_categories')}
            />
          )}
        </div>

        {/* Appear in Home Categories */}
        {isInitialDataReady && appear_in_home_categories2.map((categoriess, index) => (
          <div className="container max-md:overflow-hidden w-full" key={index}>
            {loadingCategories || !categoriess?.children?.length ? (
              <div className="flex items-center justify-center h-40">
                <Spinner size="lg" />
              </div>
            ) : (
              <CategoriesSlider 
                categories={categoriess.children} 
                title={categoriess.name}
              />
            )}
          </div>
        ))}

        {/* Products Sections */}
        <div className="container flex flex-col gap-10 mt-20">
          {!isInitialDataReady ? (
            <div className="flex items-center justify-center h-60">
              <Spinner size="lg" />
            </div>
          ) : categories2.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {t('no_categories')}
            </div>
          ) : (
            categories2.map((category) => {
              const hasProducts =
                Array.isArray(category.products) && category.products.length > 0;
              if (!hasProducts) return null;

              const banners = category.category_banners || [];
              const hasBanners = banners.length > 0;

              return (
                <section
                  key={category.id}
                  className="rounded-[10px_10px_0_0] md:rounded-3xl md:border md:border-gray-100 !bg-gray-50/50 overflow-hidden"
                >
                  <div className="flex items-end justify-between mb-2">
                    <h2 className="text-md md:text-2xl ms-1 md:ms-2 drop-shadow whitespace-nowrap">
                      {category.name}
                    </h2>
                    <Link
                      href={`/category/${category.id}`}
                      className="text-pro-max z-7 text-sm md:text-base font-semibold whitespace-nowrap rounded-full bg-white/15 hover:bg-white/25 transition"
                    >
                      {t('view_all')}
                    </Link>
                  </div>

                  <div className="relative w-full p-3 px-0">
                    {hasBanners ? (
                      <div dir="rtl" className={`grid gap-3 ${banners.length === 1 ? 'grid-cols-1' : 'grid-cols-1'} sm:grid-cols-1 md:grid-cols-${Math.min(banners.length, 4)}`}>
                        {banners.map((banner: CategoryBannerI, index: number) => (
                          <div
                            key={banner.id}
                            className={`relative h-15 md:h-29 overflow-hidden ${
                              index === 0 ? "rounded-tr-2xl rounded-tl-2xl md:rounded-tl-none" :
                              index === banners.length - 1 ? "rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none" : ""
                            }`}
                          >
                            <Image
                              src={banner.image || "/images/cover2.png"}
                              alt={banner.alt || category.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-center"
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative h-29 rounded-[10px_10px_0_0] md:rounded-t-3xl overflow-hidden">
                        <Image
                          src="/images/cover2.png"
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 1200px"
                          className="object-cover"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                      </div>
                    )}
                  </div>

                  <div className="md:px-6 md:pb-5">
                    <InStockSlider
                      inStock={category.products}
                      isLoading={false}
                      title=""
                      hiddenArrow={false}
                      CardComponent={(product: any) => (
                        <ProductCard
                          widthClass="
                            w-[120px]
                            [@media_(max-width:468px)]:w-[160px]
                            [@media_(min-width:469px)_and_(max-width:768px)]:w-[180px]
                            sm:w-[170px]
                            md:w-[190px]
                          "
                          {...product}
                          product={{
                            ...product,
                            showBuyNow: true,
                            price_text: product.price_text
                          }}
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          image={product.image || "/images/c1.png"}
                          price={product.price}
                          final_price={product.final_price}
                          discount={product.discount}
                          stock={product.stock}
                          average_rating={product.average_rating}
                          reviews={product.reviews}
                          className="hidden"
                          className2="hidden"
                          classNameHome=""
                          Bottom="bottom-3"
                        />
                      )}
                    />
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {hasNext && isInitialDataReady && (
          <div className="mt-2 flex items-center container justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-2xl px-6 py-3 font-extrabold shadow-sm border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? <Spinner size="sm" /> : t('refresh')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}