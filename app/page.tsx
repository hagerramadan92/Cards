import { cookies } from "next/headers";
import Link from "next/link";
import { CreditCard, Headset, ShieldCheck, Zap } from "lucide-react";
import type { CategoryI } from "@/Types/CategoriesI";
import type { BannerI } from "@/Types/BannerI";
import { fetchApi } from "@/lib/api";
import Image from "@/components/ImageWithFallback";
import HomeDataHydrator from "@/components/HomeDataHydrator";
import HomepageHero from "@/components/HomepageHero";
import LazyFastBuy from "@/components/HomeSection/LazyFastBuy";
import { translations, type TranslationKey } from "@/src/translations";

const supportedLanguages = new Set(["ar", "en", "fr"]);

function getTranslation(language: string, key: TranslationKey): string {
  const languageDictionary =
    translations[language as keyof typeof translations] || translations.ar;
  const localizedValue = (
    languageDictionary as Partial<Record<TranslationKey, unknown>>
  )[key];
  const fallbackValue = translations.ar[key];

  if (typeof localizedValue === "string") return localizedValue;
  if (typeof fallbackValue === "string") return fallbackValue;
  return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCategories(value: unknown): CategoryI[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (category) =>
        isRecord(category) &&
        typeof category.id === "number" &&
        typeof category.name === "string" &&
        typeof category.image === "string",
    )
    .map((category) => {
      const record = category as Record<string, unknown>;

      return {
        id: record.id as number,
        name: record.name as string,
        slug: typeof record.slug === "string" ? record.slug : "",
        description:
          typeof record.description === "string" ? record.description : "",
        order: typeof record.order === "number" ? record.order : 0,
        image: record.image as string,
        sub_image:
          typeof record.sub_image === "string" ? record.sub_image : "",
        is_parent:
          typeof record.is_parent === "boolean" ? record.is_parent : true,
      };
    });
}

function findActiveSlider(value: unknown): BannerI | null {
  if (!Array.isArray(value)) return null;

  const slider = value.find(
    (banner) =>
      isRecord(banner) &&
      Array.isArray(banner.items) &&
      banner.items.length > 0,
  );

  return slider ? (slider as BannerI) : null;
}

export default async function Home() {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get("preferred-language")?.value;
  const language =
    savedLanguage && supportedLanguages.has(savedLanguage)
      ? savedLanguage
      : "ar";

  const [categoriesResult, bannersResult] = await Promise.allSettled([
    fetchApi("categories?type=parent", {}, language) as Promise<unknown>,
    fetchApi("banners?type=main_slider", {}, language) as Promise<unknown>,
  ]);

  const parentCategories =
    categoriesResult.status === "fulfilled"
      ? normalizeCategories(categoriesResult.value)
      : [];
  const activeHeroSlider =
    bannersResult.status === "fulfilled"
      ? findActiveSlider(bannersResult.value)
      : null;
  const shouldRetryCriticalData = categoriesResult.status === "rejected";

  const heroFeatures = [
    {
      icon: Zap,
      title: getTranslation(language, "feature_instant_delivery"),
      description: getTranslation(language, "feature_instant_delivery_desc"),
    },
    {
      icon: ShieldCheck,
      title: getTranslation(language, "feature_secure_payment"),
      description: getTranslation(language, "feature_secure_payment_desc"),
    },
    {
      icon: CreditCard,
      title: getTranslation(language, "feature_competitive_prices"),
      description: getTranslation(language, "feature_competitive_prices_desc"),
    },
    {
      icon: Headset,
      title: getTranslation(language, "feature_support_24_7"),
      description: getTranslation(language, "feature_support_24_7_desc"),
    },
  ];

  return (
    <>
      <HomeDataHydrator
        homeData={null}
        parentCategories={parentCategories}
        shouldRetry={shouldRetryCriticalData}
        language={language}
      />

      <div className="app-container !mt-6 !mb-10">
        <div className="flex flex-col gap-5 md:gap-7">
          <HomepageHero
            key={language}
            initialSlider={activeHeroSlider}
            language={language}
          />

          <section className="section-shell">
            <div className="section-header mb-4">
              <div>
                <h2
                  className="text-xl font-extrabold md:text-2xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  {getTranslation(language, "main_categories")}
                </h2>
              </div>
              <Link href="/category" className="secondary-button text-sm">
                {getTranslation(language, "view_all")}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              {parentCategories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="group rounded-[20px] border p-3 hover:border-orange-500/30"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="relative mb-4 aspect-[1.08] overflow-hidden rounded-2xl"
                    style={{ background: "var(--image-shell)" }}
                  >
                    <Image
                      src={category.image || "/images/c1.png"}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 12.5vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div
                    className="text-center text-sm font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {category.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {heroFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="surface-card flex min-w-0 flex-col items-center gap-2 px-3 py-4 text-center md:flex-row md:gap-4 md:px-5 md:text-start"
                >
                  <div className="icon-button shrink-0 text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {feature.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400 md:text-xs">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <div className="md:flex hidden">
            {parentCategories.length > 0 ? (
              <div className="section-shell w-full">
                <LazyFastBuy categories={parentCategories} />
              </div>
            ) : (
              <div className="surface-card h-24 w-full animate-pulse rounded-xl bg-white/5" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
