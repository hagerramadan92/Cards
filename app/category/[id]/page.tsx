"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import Image from "@/components/ImageWithFallback";
import { ProductI } from "@/Types/ProductsI";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  FileText,
  Package,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import Spinner from "@/components/Spinner/spinner";

interface CategoryChild {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  products?: ProductI[];
  products_count?: number;
  product_count?: number;
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

type ProductCountry = string | { code?: string };
type FilterableProduct = ProductI & {
  shipping_countries?: ProductCountry[];
  countries?: ProductCountry[];
  available_countries?: ProductCountry[];
  country?: ProductCountry;
  country_code?: string;
  created_at?: string;
};

function findCategoryContext(categories: CategoryData[], categoryId: string) {
  const numericId = Number(categoryId);
  const directCategory = categories.find((item) => item.id === numericId);
  if (directCategory?.children?.length) {
    return { category: directCategory, parent: null };
  }

  for (const parent of categories) {
    const child = parent.children?.find((item) => item.id === numericId);
    if (child) {
      return {
        category: {
          ...child,
          is_parent: false,
          children: [],
          products: [],
          category_banners: [],
        } as CategoryData,
        parent,
      };
    }
  }

  if (directCategory) return { category: directCategory, parent: null };

  return null;
}

/* -------------------- Sub-Category Card -------------------- */
function CategoryCard({
  category,
  parentId,
}: {
  category: CategoryChild;
  parentId: number;
}) {
  const productCount =
    category.products_count ??
    category.product_count ??
    category.products?.length ??
    0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition hover:border-orange-500/70 hover:shadow-lg"
    >
      <Link
        href={`/category/${parentId}/${category.id}`}
        className="flex h-full min-h-[210px] flex-col items-center justify-center p-4 md:min-h-[235px] md:p-5"
        aria-label={`${category.name} - ${productCount} منتج`}
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--image-shell)] p-2 shadow-inner md:h-28 md:w-28">
          <Image
            src={category.image || "/images/noimg.png"}
            alt={category.name}
            fill
            sizes="112px"
            className="rounded-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </div>
        <h3 className="mt-4 line-clamp-1 text-center text-sm font-black text-[var(--text-primary)] md:text-base">
          {category.name}
        </h3>
        <p className="mt-1.5 text-center text-xs font-semibold text-[var(--text-muted)] md:text-sm">
          {productCount} منتج
        </p>
      </Link>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
};

interface FiltersPanelProps {
  countries: { code: string; name: string; flag: string }[];
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  priceFrom: string;
  setPriceFrom: (value: string) => void;
  priceTo: string;
  setPriceTo: (value: string) => void;
  priceOrder: "" | "asc" | "desc" | "rating" | "latest";
  setPriceOrder: (value: "" | "asc" | "desc" | "rating" | "latest") => void;
  sortOptions: {
    label: string;
    value: "" | "rating" | "asc" | "desc" | "latest";
  }[];
  allCountriesLabel: string;
  filtersLabel: string;
  priceLabel: string;
  fromLabel: string;
  toLabel: string;
  sortLabel: string;
  resetLabel: string;
}

function FiltersPanel({
  countries,
  selectedCountry,
  setSelectedCountry,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  priceOrder,
  setPriceOrder,
  sortOptions,
  allCountriesLabel,
  filtersLabel,
  priceLabel,
  fromLabel,
  toLabel,
  sortLabel,
  resetLabel,
}: FiltersPanelProps) {
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-pro-max" />
        <h2 className="text-base font-black text-slate-900">{filtersLabel}</h2>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">
            {allCountriesLabel}
          </span>
          <select
            value={selectedCountry}
            onChange={(event) => setSelectedCountry(event.target.value)}
            className={inputClass}
          >
            <option value="">{allCountriesLabel}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-slate-700">
            {priceLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={priceFrom}
              onChange={(event) => setPriceFrom(event.target.value)}
              placeholder={fromLabel}
              aria-label={`${priceLabel} ${fromLabel}`}
              className={inputClass}
            />
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={priceTo}
              onChange={(event) => setPriceTo(event.target.value)}
              placeholder={toLabel}
              aria-label={`${priceLabel} ${toLabel}`}
              className={inputClass}
            />
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">
            {sortLabel}
          </span>
          <select
            value={priceOrder}
            onChange={(event) =>
              setPriceOrder(
                event.target.value as FiltersPanelProps["priceOrder"],
              )
            }
            className={inputClass}
          >
            {sortOptions.map((option) => (
              <option key={option.value || "default"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setSelectedCountry("");
            setPriceFrom("");
            setPriceTo("");
            setPriceOrder("");
          }}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-orange-400 hover:text-pro-max"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const params = useParams<{ id: string; subId?: string }>();
  const categoryId = params.subId || params.id;
  const routeParentId = params.subId ? params.id : null;
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryData | null>(
    null,
  );

  const [allProducts, setAllProducts] = useState<ProductI[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryChild[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductI[]>([]);

  // UI state
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const [priceOrder, setPriceOrder] = useState<
    "" | "asc" | "desc" | "rating" | "latest"
  >("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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
      setParentCategory(null);
      try {
        const headers = {
          "Accept-Language": language,
          Accept: "application/json",
        };
        const categoriesRes = await fetch(`${API_URL}/categories`, { headers });
        const categoriesResult = await categoriesRes.json();
        const categories: CategoryData[] = categoriesResult.status
          ? categoriesResult.data
          : [];
        const selectedContext = findCategoryContext(categories, categoryId);

        if (!selectedContext) {
          setCategory(null);
          return;
        }

        const expectedParent = routeParentId
          ? categories.find((item) => item.id === Number(routeParentId))
          : selectedContext.parent;

        if (
          routeParentId &&
          (!expectedParent ||
            !expectedParent.children?.some(
              (child) => child.id === selectedContext.category.id,
            ))
        ) {
          setCategory(null);
          return;
        }

        setParentCategory(expectedParent || null);

        if (selectedContext.category.children?.length) {
          // The lightweight categories endpoint does not include products.
          // Fetch only one row per child so we can read each pagination total.
          const childrenWithCounts = await Promise.all(
            selectedContext.category.children.map(async (child) => {
              try {
                const countRes = await fetch(
                  `${API_URL}/products?category_id=${child.id}&per_page=1&page=1`,
                  { headers },
                );
                const countResult = await countRes.json();
                return {
                  ...child,
                  products_count: Number(
                    countResult?.meta?.total ??
                      countResult?.pagination?.total ??
                      countResult?.data?.length ??
                      0,
                  ),
                };
              } catch {
                return { ...child, products_count: 0 };
              }
            }),
          );

          const parentCategoryData: CategoryData = {
            ...selectedContext.category,
            children: childrenWithCounts,
            products: [],
            category_banners: selectedContext.category.category_banners || [],
          };
          setCategory(parentCategoryData);
          setSubCategories(childrenWithCounts);
          setAllProducts([]);
          setFilteredProducts([]);
          return;
        }

        // A leaf request returns products for this sub-category only.
        const detailRes = await fetch(`${API_URL}/categories/${categoryId}`, {
          headers,
        });
        const detailResult = await detailRes.json();
        if (!detailResult.status || !detailResult.data) {
          setCategory(null);
          return;
        }

        const leafCategory: CategoryData = detailResult.data;
        const products = leafCategory.products || [];
        setCategory(leafCategory);
        setSubCategories([]);
        setAllProducts(products);
        setFilteredProducts(products);
      } catch (err) {
        console.error("Error fetching category:", err);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryAndProducts();
  }, [categoryId, routeParentId, API_URL, language]);

  // Filter only the products returned by the opened sub-category endpoint.
  useEffect(() => {
    const from = Number(priceFrom);
    const to = Number(priceTo);
    const filtered = allProducts.filter((product) => {
      const filterableProduct = product as FilterableProduct;
      const price = Number(product.final_price ?? product.price ?? 0);
      if (priceFrom && price < from) return false;
      if (priceTo && price > to) return false;
      if (!selectedCountry) return true;

      const productCountries =
        filterableProduct.shipping_countries ||
        filterableProduct.countries ||
        filterableProduct.available_countries ||
        [];
      const productCountry =
        filterableProduct.country || filterableProduct.country_code;

      if (Array.isArray(productCountries) && productCountries.length > 0) {
        return productCountries.some((country) =>
          typeof country === "string"
            ? country === selectedCountry
            : country.code === selectedCountry,
        );
      }

      if (productCountry) {
        return (
          productCountry === selectedCountry ||
          (typeof productCountry === "object" &&
            productCountry.code === selectedCountry)
        );
      }

      return true;
    });

    setFilteredProducts(filtered);
    setPage(1);
  }, [selectedCountry, priceFrom, priceTo, allProducts]);

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
    } else if (priceOrder === "latest") {
      sorted.sort((a, b) => {
        const aDate = new Date(
          (a as FilterableProduct).created_at || 0,
        ).getTime();
        const bDate = new Date(
          (b as FilterableProduct).created_at || 0,
        ).getTime();
        return bDate - aDate;
      });
    }

    return sorted;
  }, [filteredProducts, priceOrder]);

  useEffect(() => {
    setPage(1);
  }, [priceOrder]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedProducts.slice(start, start + rowsPerPage);
  }, [sortedProducts, page]);

  const handleFavoriteChange = (productId: number, newValue: boolean) => {
    setAllProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, is_favorite: newValue } : p,
      ),
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center mt-7">
        <Spinner size="lg" />
      </div>
    );

  if (!category) {
    return (
      <div className="text-center py-20 text-xl text-gray-600" dir="rtl">
        {language === "ar"
          ? "القسم المطلوب غير موجود."
          : "The requested category was not found."}
      </div>
    );
  }

  const gridClass =
    "grid grid-cols-2   sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6";

  const copy =
    language === "ar"
      ? {
          chooseDescription: "اختر القسم الفرعي الذي تريد تصفحه.",
          filters: "تصفية النتائج",
          price: "السعر",
          from: "من",
          to: "إلى",
          sort: "ترتيب المنتجات",
          reset: "مسح الفلاتر",
          openFilters: "الفلاتر",
          latest: "الأحدث أولًا",
        }
      : {
          chooseDescription:
            "Choose one of the following services to view available products.",
          filters: "Filter results",
          price: "Price",
          from: "From",
          to: "To",
          sort: "Sort products",
          reset: "Clear filters",
          openFilters: "Filters",
          latest: "Newest first",
        };

  const sortOptions: {
    label: string;
    value: "" | "rating" | "asc" | "desc" | "latest";
  }[] = [
    { label: t("featured"), value: "" },
    { label: t("highest_rated"), value: "rating" },
    { label: t("price_low_high"), value: "asc" },
    { label: t("price_high_low"), value: "desc" },
    { label: copy.latest, value: "latest" },
  ];

  function getPages(
    current: number,
    total: number,
    range: number = 1, // 👈 reduce this on mobile
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
  const hasSubCategories = subCategories.length > 0;
  const hasProductSidebar =
    !hasSubCategories &&
    Boolean(
      allProducts.length ||
      category.description ||
      category.instructions ||
      category.terms,
    );

  return (
    <section className="min-h-[55vh] pb-8 md:pb-12">
      <div className="container px-4 pb-6 pt-5 md:px-0 md:pb-10 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 md:mb-10"
        >
          <nav
            aria-label="breadcrumb"
            className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-muted)] md:text-sm"
          >
            <Link href="/" className="hover:text-orange-500">
              {t("home")}
            </Link>
            {parentCategory && (
              <>
                <span aria-hidden="true">›</span>
                <Link
                  href={`/category/${parentCategory.id}`}
                  className="hover:text-orange-500"
                >
                  {parentCategory.name}
                </Link>
              </>
            )}
            <span aria-hidden="true">›</span>
            <span aria-current="page" className="text-[var(--text-secondary)]">
              {category.name}
            </span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[var(--text-primary)] md:text-3xl">
                {category.name}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                {hasSubCategories
                  ? copy.chooseDescription
                  : `${t("display")} ${filteredProducts.length} ${t("product_singular")}`}
              </p>
              {category.description && (
                <div
                  className={`mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] ${
                    hasSubCategories ? "" : "hidden"
                  }`}
                  dangerouslySetInnerHTML={{ __html: category.description }}
                />
              )}
            </div>
            {!hasSubCategories && allProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black text-[var(--text-primary)] shadow-sm lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 text-orange-500" />
                {copy.openFilters}
              </button>
            )}
          </div>
        </motion.div>

        {/* Products and Description Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Description, Instructions, Terms - 3 columns */}
          <div
            className={
              hasProductSidebar
                ? "order-1 space-y-3 md:space-y-4 lg:order-2 lg:col-span-3 lg:self-start lg:sticky lg:top-[160px]"
                : "hidden"
            }
          >
            {/* {allProducts.length > 0 && (
							<div className="hidden lg:block">
								<FiltersPanel
									countries={countries}
									selectedCountry={selectedCountry}
									setSelectedCountry={setSelectedCountry}
									priceFrom={priceFrom}
									setPriceFrom={setPriceFrom}
									priceTo={priceTo}
									setPriceTo={setPriceTo}
									priceOrder={priceOrder}
									setPriceOrder={setPriceOrder}
									sortOptions={sortOptions}
									allCountriesLabel={t('all_countries')}
									filtersLabel={copy.filters}
									priceLabel={copy.price}
									fromLabel={copy.from}
									toLabel={copy.to}
									sortLabel={copy.sort}
									resetLabel={copy.reset}
								/>
							</div>
						)} */}

            {/* Description */}
            {category.description && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                  className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
                  aria-label="Toggle description"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-pro-max shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {t("description")}
                    </h3>
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
                        <div
                          className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm"
                          dangerouslySetInnerHTML={{
                            __html: category.description,
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Instructions */}
            {category.instructions && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                  className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
                  aria-label="Toggle instructions"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-pro-max shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {t("instructions")}
                    </h3>
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
                        <div
                          className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm"
                          dangerouslySetInnerHTML={{
                            __html: category.instructions,
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Terms */}
            {category.terms && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsTermsOpen(!isTermsOpen)}
                  className="w-full flex items-center justify-between gap-2 p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition"
                  aria-label="Toggle terms"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-pro-max shrink-0" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {t("terms_conditions")}
                    </h3>
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
                        <div
                          className="prose prose-sm max-w-none text-slate-700 text-xs md:text-sm"
                          dangerouslySetInnerHTML={{ __html: category.terms }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div
            className={
              hasSubCategories || !hasProductSidebar
                ? "order-2 lg:col-span-12"
                : "order-2 lg:order-1 lg:col-span-9"
            }
          >
            {/* Products or Sub-categories Grid */}
            {hasSubCategories ? (
              <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {subCategories.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={idx}
                  >
                    <CategoryCard category={sub} parentId={category.id} />
                  </motion.div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-6 md:p-10 text-center w-full"
              >
                <Package className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                <p className="text-slate-700 font-extrabold text-base md:text-lg">
                  {allProducts.length > 0
                    ? t("no_products_found")
                    : t("no_products")}
                </p>
              </motion.div>
            ) : (
              <motion.div layout className={gridClass}>
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
                          ? {
                              value: product.discount.value.toString(),
                              type: product.discount.type,
                            }
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

            {!hasSubCategories && sortedProducts.length > rowsPerPage && (
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
                    aria-label={t("previous")}
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
                          aria-label={`${t("page_singular")} ${p}`}
                        >
                          {p}
                        </motion.button>
                      ),
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
                    aria-label={t("next")}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileFiltersOpen && !hasSubCategories && (
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={copy.filters}
          >
            <motion.button
              type="button"
              aria-label={t("close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="absolute inset-0 h-full w-full bg-slate-950/55"
            />
            <motion.div
              initial={{ x: language === "ar" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: language === "ar" ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className={`absolute inset-y-0 w-[min(88vw,360px)] overflow-y-auto bg-white p-4 shadow-2xl ${
                language === "ar" ? "right-0" : "left-0"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">
                  {copy.filters}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700"
                  aria-label={t("close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FiltersPanel
                countries={countries}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                priceFrom={priceFrom}
                setPriceFrom={setPriceFrom}
                priceTo={priceTo}
                setPriceTo={setPriceTo}
                priceOrder={priceOrder}
                setPriceOrder={setPriceOrder}
                sortOptions={sortOptions}
                allCountriesLabel={t("all_countries")}
                filtersLabel={copy.filters}
                priceLabel={copy.price}
                fromLabel={copy.from}
                toLabel={copy.to}
                sortLabel={copy.sort}
                resetLabel={copy.reset}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
