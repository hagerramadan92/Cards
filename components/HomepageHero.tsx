"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BannerI } from "@/Types/BannerI";
import { fetchApi } from "@/lib/api";
import { useLanguage } from "@/src/context/LanguageContext";
import Image from "@/components/ImageWithFallback";
import Spinner from "@/components/Spinner/spinner";

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
  const [shouldLoadInteractiveSlider, setShouldLoadInteractiveSlider] =
    useState(false);
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
    if (!slider) return;

    let idleCallbackId: number | undefined;
    let fallbackTimer: number | undefined;

    const scheduleInteractiveSlider = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleCallbackId = window.requestIdleCallback(
          () => setShouldLoadInteractiveSlider(true),
          { timeout: 2000 },
        );
      } else {
        fallbackTimer = window.setTimeout(
          () => setShouldLoadInteractiveSlider(true),
          200,
        );
      }
    };

    if (document.readyState === "complete") {
      scheduleInteractiveSlider();
    } else {
      window.addEventListener("load", scheduleInteractiveSlider, {
        once: true,
      });
    }

    return () => {
      window.removeEventListener("load", scheduleInteractiveSlider);
      if (idleCallbackId !== undefined) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [slider]);

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
        <div className="h-[200px] md:h-[420px] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
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
              <Image
                src={
                  firstSlide.mobile_image ||
                  firstSlide.image ||
                  "/images/placeholder.png"
                }
                alt={firstSlide.alt || "Slide 1"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                priority
                fetchPriority="high"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            </Link>
          </div>

          {shouldLoadInteractiveSlider && (
            <InteractiveSlider
              src={slider}
              prioritizeFirstImage={false}
              onReady={() => setIsInteractiveSliderReady(true)}
            />
          )}
        </div>
      ) : (
        <div className="h-[200px] md:h-[420px] flex items-center justify-center text-slate-400">
          {t("no_categories")}
        </div>
      )}
    </div>
  );
}
