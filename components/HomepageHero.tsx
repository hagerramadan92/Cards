"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BannerI } from "@/Types/BannerI";
import { fetchApi } from "@/lib/api";
import { useLanguage } from "@/src/context/LanguageContext";
import HeroResponsiveImage from "@/components/HeroResponsiveImage";

const InteractiveSlider = dynamic(() => import("@/components/SliderComponent"), {
  ssr: false,
});

type HomepageHeroProps = {
  initialSlider: BannerI | null;
  language: string;
};

function findActiveSlider(value: unknown): BannerI | null {
  if (!Array.isArray(value)) return null;

  const slider = value.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "items" in item &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );

  return slider ? (slider as BannerI) : null;
}

export default function HomepageHero({
  initialSlider,
  language,
}: HomepageHeroProps) {
  const { t } = useLanguage();
  const [slider, setSlider] = useState(initialSlider);
  const [isLoading, setIsLoading] = useState(!initialSlider);
  const [isInteractiveSliderReady, setIsInteractiveSliderReady] =
    useState(false);

  const firstSlide = useMemo(() => {
    const items = slider?.items ?? [];
    return [...items]
      .filter((item) => Boolean(item.mobile_image || item.image))
      .filter((item) => item.is_active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  }, [slider]);

  const loadSlider = useCallback(async (requestedLanguage: string) => {
    setIsLoading(true);

    try {
      const data: unknown = await fetchApi(
        "banners?type=main_slider",
        {},
        requestedLanguage,
      );
      setSlider(findActiveSlider(data));
    } catch {
      setSlider(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSlider) {
      void loadSlider(language);
    }
  }, [initialSlider, language, loadSlider]);

  useEffect(() => {
    const handleServerRefreshFailure = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;

      const detail = event.detail as { language?: unknown } | null;
      if (typeof detail?.language === "string") {
        void loadSlider(detail.language);
      }
    };

    window.addEventListener(
      "languageServerRefreshFailed",
      handleServerRefreshFailure,
    );

    return () => {
      window.removeEventListener(
        "languageServerRefreshFailed",
        handleServerRefreshFailure,
      );
    };
  }, [loadSlider]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {isLoading ? (
        <div
          className="h-[200px] min-h-[200px] animate-pulse md:h-[420px] md:min-h-[420px]"
          style={{ background: "var(--image-shell)" }}
        />
      ) : slider && firstSlide ? (
        <div className="relative w-full h-[200px] md:h-[420px] min-h-[200px] md:min-h-[420px] aspect-[16/7] group">
          <div
            className={`absolute inset-0 z-10 ${
              isInteractiveSliderReady ? "pointer-events-none opacity-0" : ""
            }`}
            aria-hidden={isInteractiveSliderReady}
          >
            <Link
              href={
                firstSlide.is_link_active === false
                  ? "/"
                  : firstSlide.link_url || "/"
              }
              target={firstSlide.link_target || "_self"}
              aria-label="Go to slide 1"
              tabIndex={isInteractiveSliderReady ? -1 : undefined}
              className="block h-full w-full relative"
            >
              <HeroResponsiveImage
                desktopSrc={firstSlide.image || "/images/placeholder.webp"}
                mobileSrc={firstSlide.mobile_image}
                alt={firstSlide.alt || "Slide 1"}
                priority
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            </Link>
          </div>

          <InteractiveSlider
            src={slider}
            prioritizeFirstImage={false}
            onReady={() => setIsInteractiveSliderReady(true)}
          />
        </div>
      ) : (
        <div className="h-[200px] md:h-[420px] flex items-center justify-center text-slate-400">
          {t("no_categories")}
        </div>
      )}
    </div>
  );
}
