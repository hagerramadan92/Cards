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
import { CreditCard, Gamepad2, Headset, ShieldCheck, Zap } from "lucide-react";
import { ProductI } from "@/Types/ProductsI";
import { SubCategoriesI } from "@/Types/SubCategoriesI";

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

type HomeCategorySection = SubCategoriesI;

export default function Home() {
  const { 
    homeData, 
    loadingCategories, 
    parentCategories, 
    loadingHome, 
  } = useAppContext();
  
  const { t, language } = useLanguage();

  const [isInitialDataReady, setIsInitialDataReady] = useState(false);
  
  const [isFastBuyReady, setIsFastBuyReady] = useState(false);
  
  const [categories2, setCategories2] = useState<HomeCategorySection[]>([]);
  const [paginationState, setPaginationState] = useState<{ next_page?: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [appear_in_home_categories2, setAppear_in_home_categories2] = useState<HomeCategorySection[]>([]);
  
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

      const newCats = (res?.data?.sub_categories ?? res?.sub_categories ?? []) as HomeCategorySection[];
      const newPagination =
        res?.data?.sub_categories_pagination ??
        res?.sub_categories_pagination ??
        res?.pagination ??
        null;

      setCategories2(prev => {
        const merged = [...prev, ...(Array.isArray(newCats) ? newCats : [])];
        const map = new Map(merged.map((c) => [c.id, c]));
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
      } catch {
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
    () => (
      mainSlider
        .find((banner) => Array.isArray(banner.items) && banner.items.length > 0)
        ?.items || []
    ).map((i) => i.image),
    [mainSlider]
  );

  const activeHeroSlider = useMemo(
    () => mainSlider.find((banner) => Array.isArray(banner.items) && banner.items.length > 0) ?? null,
    [mainSlider]
  );

  const heroFeatures = [
    { icon: Zap, title: "تسليم فوري" },
    { icon: ShieldCheck, title: "دفع آمن" },
    { icon: CreditCard, title: "أسعار تنافسية" },
    { icon: Headset, title: "دعم 24/7" },
  ];

  if (loadingHome && !homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="app-container !mt-6 !mb-10">
      <div className="flex flex-col gap-5 md:gap-7">
        <div className="relative overflow-hidden rounded-3xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          {isMainSliderLoading ? (
            <div className="h-[200px] md:h-[420px] flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : activeHeroSlider && sliderSrc.length > 0 ? (
            <SliderComponent src={activeHeroSlider} />
          ) : (
            <div className="h-[200px] md:h-[420px] flex items-center justify-center text-slate-400">
              {t('no_categories')}
            </div>
          )}
        </div>

        <section className="section-shell">
          <div className="section-header mb-4">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl" style={{ color: "var(--text-primary)" }}>شحن الألعاب</h2>
              <p className="mt-1 text-sm text-slate-400">أقسام مختارة للوصول السريع مثل التصميم المرجعي.</p>
            </div>
            <Link href="/category" className="secondary-button text-sm">
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {parentCategories.slice(0, 8).map((category: { id: number; name: string; image?: string }) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group rounded-[20px] border p-3 hover:border-orange-500/30"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="relative mb-4 aspect-[1.08] overflow-hidden rounded-2xl" style={{ background: "var(--image-shell)" }}>
                  <Image
                    src={category.image || "/images/c1.png"}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 12.5vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="text-center text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {heroFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="surface-card flex items-center gap-4 px-5 py-4">
                <div className="icon-button text-orange-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{feature.title}</p>
                  <p className="text-xs text-slate-400">خدمة موثوقة لعملائك داخل المتجر.</p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="md:flex hidden">
          {isFastBuyReady ? (
            <div className="section-shell w-full">
              <FastBuy categories={parentCategories} />
            </div>
          ) : (
            <div className="surface-card h-24 w-full animate-pulse rounded-xl bg-white/5"></div>
          )}
        </div>

        {/* Popular Categories */}
        {/* <div className="container max-md:overflow-hidden w-full pt-8 mt-20">
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
        </div> */}

        {/* Appear in Home Categories */}
        {isInitialDataReady && appear_in_home_categories2.map((categoriess, index) => (
          <div className="w-full" key={index}>
            {loadingCategories || !categoriess?.children?.length ? (
              <div className="flex items-center justify-center h-40">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="section-shell">
                <CategoriesSlider 
                  categories={categoriess.children} 
                  title={categoriess.name}
                  parentCategoryId={categoriess.id}
                  parentCategorySlug={categoriess.slug}
                />
              </div>
            )}
          </div>
        ))}

        {/* Products Sections */}
        <div className="flex flex-col gap-6 mt-2">
          {!isInitialDataReady ? (
            <div className="flex items-center justify-center h-60">
              <Spinner size="lg" />
            </div>
          ) : categories2.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
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
                  className="section-shell rounded-3xl overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="icon-button border-orange-500/20 bg-orange-500/10 text-orange-300">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-2xl font-extrabold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                          {category.name}
                        </h2>
                        <p className="text-xs md:text-sm text-slate-400">منتجات ديناميكية محدثة من الـ API.</p>
                      </div>
                    </div>
                    <Link
                      href={`/category/${category.id}`}
                      className="secondary-button z-7 text-sm md:text-base whitespace-nowrap"
                    >
                      {t('view_all')}
                    </Link>
                  </div>

                  <div className="relative w-full p-0">
                    {hasBanners ? (
                      <div dir="rtl" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {banners.map((banner: CategoryBannerI, index: number) => (
                          <div
                            key={banner.id}
                            className={`relative h-28 md:h-36 overflow-hidden rounded-2xl border border-white/8 ${
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
                      <div className="relative h-28 md:h-36 rounded-2xl overflow-hidden border border-white/8">
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

                  <div className="md:pb-2 mt-4">
                    <InStockSlider
                      inStock={category.products}
                      isLoading={false}
                      title=""
                      hiddenArrow={false}
                      CardComponent={(product: ProductI) => (
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
          <div className="mt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="primary-button disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? <Spinner size="sm" /> : t('refresh')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
