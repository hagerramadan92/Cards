"use client";


import React, { useEffect, useMemo, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import toast from "react-hot-toast";

import HearComponent from "@/components/HearComponent";
import RatingStars from "@/components/RatingStars";
import ProductGallery from "@/components/ProductGallery";
import CustomSeparator from "@/components/Breadcrumbs";
import ButtonComponent from "@/components/ButtonComponent";
import InStockSlider from "@/components/InStockSlider";
import ProductCard from "@/components/ProductCard";

import { useAuth } from "@/src/context/AuthContext";
import { useAppContext } from "@/src/context/AppContext";
import { useCart } from "@/src/context/CartContext";
import { useLanguage } from "@/src/context/LanguageContext";

import { FiAlertTriangle } from "react-icons/fi";
import { IoIosArrowDown } from "react-icons/io";
import { Trash2, Star, ChevronLeft, ChevronRight, ShieldCheck, Truck, Tags, Package, BookOpen, FileText, ShoppingCart } from "lucide-react";

import { ProductPageSkeleton, StickerFormSkeleton } from "../../../components/skeletons/HomeSkeletons";

// MUI (StickerForm)
import {
	Box,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormHelperText,
	CircularProgress,
	Alert,
	Button,
	Checkbox,
	ListItemText,
	Divider,
} from "@mui/material";
import { Save, CheckCircle, Warning, Info, Refresh } from "@mui/icons-material";

/* ------------------------------------------
 * Types
 * ------------------------------------------ */

type TabKey = "options" | "reviews";

type ReviewUser = {
	id: number;
	name: string;
	avatar: string | null;
	is_verified?: boolean;
};

type Review = {
	id: number;
	product_id: number;
	user_id: number;
	rating: number;
	comment: string;
	is_verified: boolean;
	created_at: string;
	human_created_at?: string;
	user?: ReviewUser;
};

// ✅ SelectedOptions (must match StickerForm getOptions keys)
export type SelectedOptions = {
	size: string;

	// ✅ tier selection for size
	size_tier_id?: number | null;
	size_quantity?: number | null;
	size_price_per_unit?: number | null;
	size_total_price?: number | null;

	color: string;
	material: string;
	optionGroups: Record<string, string>;
	printing_method: string;

	// ✅ multi-select print locations (names in UI)
	print_locations: string[];

	isValid: boolean;
};

export interface StickerFormHandle {
	getOptions: () => SelectedOptions;
	validate: () => boolean;
}

/* ------------------------------------------
 * Shared helpers / rules
 * ------------------------------------------ */

const num = (v: any) => {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
};

function getQty(opts: SelectedOptions) {
	const q = Math.floor(num(opts?.size_quantity));
	return q > 0 ? q : 1;
}

function computeSizeBaseTotal(opts: SelectedOptions) {
	const total = num(opts?.size_total_price);
	if (total > 0) return total;

	const qty = num(opts?.size_quantity);
	const unit = num(opts?.size_price_per_unit);
	const calc = qty > 0 && unit > 0 ? qty * unit : 0;
	return calc > 0 ? calc : 0;
}


function isOneTimeServiceOption(optionName: string, optionValue?: string) {
	const name = String(optionName || "").trim().toLowerCase();
	const value = String(optionValue || "").trim().toLowerCase();

	// Arabic variants
	const ar1 = name.includes("خدمة تصميم");
	const ar2 = name.includes("خدمة التصميم");
	const ar3 = value.includes("خدمة تصميم") || value.includes("خدمة التصميم");

	// English variants
	const en1 = name.includes("design");
	const en2 = value.includes("design");

	return ar1 || ar2 || ar3 || en1 || en2;
}

/**
 * ✅ RULE (1) IDs payload only (no duplication in selected_options)
 */
function buildIdsPayload(apiData: any, opts: SelectedOptions) {
	const sizeObj = apiData?.sizes?.find((s: any) => s?.name === opts.size);
	const colorObj = apiData?.colors?.find((c: any) => c?.name === opts.color);
	const materialObj = apiData?.materials?.find((m: any) => m?.name === opts.material);
	const pmObj = apiData?.printing_methods?.find((p: any) => p?.name === opts.printing_method);

	// ✅ print locations => IDs only
	const printLocationIds =
		Array.isArray(opts.print_locations) && opts.print_locations.length
			? opts.print_locations
				.map((name: any) => apiData?.print_locations?.find((pl: any) => pl?.name === name)?.id)
				.filter((id: any) => typeof id === "number")
			: [];

	return {
		size_id: typeof sizeObj?.id === "number" ? sizeObj.id : null,
		color_id: typeof colorObj?.id === "number" ? colorObj.id : null,
		material_id: typeof materialObj?.id === "number" ? materialObj.id : null,
		printing_method_id: typeof pmObj?.id === "number" ? pmObj.id : null,
		print_locations: printLocationIds,
		embroider_locations: [],
	};
}


function buildSelectedOptionsWithPrice(apiData: any, opts: SelectedOptions) {
	const selected_options: Array<{ option_name: string; option_value: string; additional_price: number }> = [];
	const qty = getQty(opts);

	Object.entries(opts.optionGroups || {}).forEach(([group, value]) => {
		if (!value || value === "اختر") return;

		const row = apiData?.options?.find(
			(o: any) =>
				String(o.option_name || "").trim() === String(group).trim() &&
				String(o.option_value || "").trim() === String(value).trim()
		);

		const perUnit = num(row?.additional_price);
		const oneTime = isOneTimeServiceOption(group, value);

		selected_options.push({
			option_name: group,
			option_value: value,
			additional_price: oneTime ? perUnit : perUnit * qty,
		});
	});

	return selected_options;
}

function extractValueFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return null;
	const option = options.find((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim());
	return option ? option.option_value : null;
}

function extractValuesFromOptions(options: any[], optionName: string) {
	if (!options || !Array.isArray(options)) return [];
	return options
		.filter((opt: any) => String(opt.option_name || "").trim() === String(optionName || "").trim())
		.map((x: any) => String(x.option_value || "").trim())
		.filter(Boolean);
}

/* ------------------------------------------
 * UI helpers
 * ------------------------------------------ */

const fadeUp: any = {
	hidden: { opacity: 0, y: 14 },
	show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function Sk({ className = "" }: { className?: string }) {
	return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

function ReviewsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-slate-200 bg-white p-4">
				<Sk className="h-5 w-40" />
				<Sk className="h-3 w-72 mt-3" />
				<Sk className="h-3 w-56 mt-2" />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-2xl border border-slate-200 p-4">
						<div className="flex items-center gap-3">
							<Sk className="h-10 w-10 rounded-full" />
							<div className="flex-1">
								<Sk className="h-4 w-40" />
								<Sk className="h-3 w-24 mt-2" />
							</div>
							<Sk className="h-6 w-14" />
						</div>
						<Sk className="h-3 w-full mt-4" />
						<Sk className="h-3 w-10/12 mt-2" />
					</div>
				))}
			</div>
		</div>
	);
}

function StarsRow({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: 5 }).map((_, i) => {
				const filled = i < value;
				return (
					<Star
						key={i}
						className={`w-4 h-4 ${filled ? "text-amber-500" : "text-slate-300"}`}
						fill={filled ? "currentColor" : "none"}
					/>
				);
			})}
		</div>
	);
}

function getPages(current: number, total: number): Array<number | "…"> {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

	const pages = new Set<number>([1, total, current]);
	if (current - 1 >= 1) pages.add(current - 1);
	if (current + 1 <= total) pages.add(current + 1);

	const sorted = Array.from(pages).sort((a, b) => a - b);

	const out: Array<number | "…"> = [];
	for (let i = 0; i < sorted.length; i++) {
		const p = sorted[i];
		const prev = sorted[i - 1];
		if (i > 0 && p - (prev as number) > 1) out.push("…");
		out.push(p);
	}
	return out;
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
	return (
		<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
					{icon}
					{title}
				</h3>
			</div>
			<div className="mt-4">{children}</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	const { direction } = useLanguage();
	const isRTL = direction === "rtl";
	return (
		<div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-sm font-extrabold text-slate-700">{label}</p>
			<div className={`text-sm font-black text-slate-900 ${isRTL ? "text-right" : "text-left"}`}>{value}</div>
		</div>
	);
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "emerald" }) {
	const map = {
		slate: "bg-slate-50 text-slate-700 border-slate-200",
		amber: "bg-amber-50 text-amber-800 border-amber-200",
		emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
	};
	return <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full border ${map[tone]}`}>{children}</span>;
}

function OptChip({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
			<p className="text-xs text-slate-500 font-bold">{label}</p>
			<p className="text-sm font-extrabold text-slate-900 mt-1">{value}</p>
		</div>
	);
}

const ratingLabels: Record<number, string> = {
	1: "سيئ جدًا",
	2: "سيئ",
	3: "متوسط",
	4: "جيد جدًا",
	5: "ممتاز",
};

interface StarRatingInputProps {
	value: number;
	onChange: (v: number) => void;
	disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
	const [hovered, setHovered] = useState<number | null>(null);
	const activeValue = hovered ?? value;

	return (
		<div className="flex  items-center gap-2">
			<div className={`flex items-center  gap-1 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
				{[1, 2, 3, 4, 5].map((star) => {
					const filled = star <= activeValue;

					return (
						<motion.button
							key={star}
							type="button"
							whileHover={!disabled ? { scale: 1.15 } : undefined}
							whileTap={!disabled ? { scale: 0.95 } : undefined}
							onMouseEnter={() => !disabled && setHovered(star)}
							onMouseLeave={() => !disabled && setHovered(null)}
							onClick={() => !disabled && onChange(star)}
							className="focus:outline-none"
							aria-label={`تقييم ${star} نجوم`}
						>
							<Star className={`w-10 h-10 transition-colors ${filled ? "text-amber-400" : "text-slate-300"}`} fill={filled ? "currentColor" : "none"} />
						</motion.button>
					);
				})}
			</div>

			<motion.div key={activeValue} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-extrabold text-slate-700">
				{ratingLabels[activeValue] ?? ""}
			</motion.div>
		</div>
	);
}

/* ------------------------------------------
 * StickerForm Component (shared)
 * ------------------------------------------ */

type DesignSendMethod = "whatsapp" | "email" | "upload" | null;

function getSocialValue(socialMedia: any, key: "whatsapp" | "email") {
	const arr = Array.isArray(socialMedia) ? socialMedia : [];
	const item = arr.find((x: any) => String(x?.key).toLowerCase() === key);
	const value = String(item?.value || "").trim();
	return value || null;
}

interface StickerFormProps {
	cartItemId?: number;
	productId: number;
	productData?: any;

	onOptionsChange?: (options: SelectedOptions) => void;
	showValidation?: boolean;
	// ✅ NEW
	onDesignFileChange?: (file: File | null) => void;
}

export const StickerForm = forwardRef<StickerFormHandle, StickerFormProps>(function StickerForm(
	{ cartItemId, productId, productData, onOptionsChange, showValidation = false, onDesignFileChange },
	ref
) {
	const { updateCartItem } = useCart();
	const { authToken: token, user, userId } = useAuth() as any;
	const { socialMedia } = useAppContext() as any;
	const { direction, language, t } = useLanguage();
	const isRTL = direction === "rtl";

	const API_URL = process.env.NEXT_PUBLIC_API_URL;

	// main states
	const [apiData, setApiData] = useState<any>(null);
	const [formLoading, setFormLoading] = useState(true);
	const [apiError, setApiError] = useState<string | null>(null);

	const [size, setSize] = useState("اختر");
	const [color, setColor] = useState("اختر");
	const [material, setMaterial] = useState("اختر");
	const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
	const [printingMethod, setPrintingMethod] = useState("اختر");
	const [printLocations, setPrintLocations] = useState<string[]>([]);

	// tiers
	const [sizeTierId, setSizeTierId] = useState<number | null>(null);
	const [sizeTierQty, setSizeTierQty] = useState<number | null>(null);
	const [sizeTierUnit, setSizeTierUnit] = useState<number | null>(null);
	const [sizeTierTotal, setSizeTierTotal] = useState<number | null>(null);

	// save UI (cart mode)
	const [saving, setSaving] = useState(false);
	const [showSaveButton, setShowSaveButton] = useState(false);
	const [savedSuccessfully, setSavedSuccessfully] = useState(false);

	// design (optional in cart mode only)
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [designSendMethod, setDesignSendMethod] = useState<DesignSendMethod>(null);
	const [designUploading, setDesignUploading] = useState(false);

	const groupedOptions = useMemo(() => {
		const list = Array.isArray(apiData?.options) ? apiData.options : [];
		const out: Record<string, any[]> = {};
		list.forEach((o: any) => {
			const k = String(o.option_name || "").trim();
			if (!k) return;
			out[k] = out[k] || [];
			out[k].push(o);
		});
		return out;
	}, [apiData]);

	const requiredOptionGroups = useMemo(() => {
		const required: string[] = [];
		Object.keys(groupedOptions).forEach((k) => {
			const items = groupedOptions[k] || [];
			if (items.some((x: any) => Boolean(x?.is_required))) required.push(k);
		});
		return required;
	}, [groupedOptions]);

	const selectedSizeObj = useMemo(() => {
		return (apiData?.sizes || []).find((s: any) => String(s?.name).trim() === String(size).trim()) || null;
	}, [apiData, size]);

	const sizeTiers = useMemo(() => {
		const tiers = selectedSizeObj?.tiers;
		return Array.isArray(tiers) ? tiers : [];
	}, [selectedSizeObj]);

	const needSize = (apiData?.sizes?.length ?? 0) > 0;
	const needColor = (apiData?.colors?.length ?? 0) > 0;
	const needMaterial = (apiData?.materials?.length ?? 0) > 0;
	const needPrintingMethod = (apiData?.printing_methods?.length ?? 0) > 0;
	const needPrintLocation = (apiData?.print_locations?.length ?? 0) > 0;
	const needSizeTier = needSize && size !== "اختر" && sizeTiers.length > 0;

	const validateCurrentOptions = useCallback(() => {
		if (!apiData) return false;

		let isValid = true;

		if (needSize && size === "اختر") isValid = false;
		if (needSizeTier && !sizeTierId) isValid = false;

		if (needColor && color === "اختر") isValid = false;
		if (needMaterial && material === "اختر") isValid = false;

		requiredOptionGroups.forEach((g) => {
			const v = optionGroups?.[g];
			if (!v || v === "اختر") isValid = false;
		});

		if (needPrintingMethod && printingMethod === "اختر") isValid = false;
		if (needPrintLocation && (!Array.isArray(printLocations) || printLocations.length === 0)) isValid = false;

		return isValid;
	}, [
		apiData,
		needSize,
		needSizeTier,
		needColor,
		needMaterial,
		needPrintingMethod,
		needPrintLocation,
		size,
		sizeTierId,
		color,
		material,
		optionGroups,
		requiredOptionGroups,
		printingMethod,
		printLocations,
	]);

	const getOptionsObj = useCallback((): SelectedOptions => {
		return {
			size,
			size_tier_id: sizeTierId,
			size_quantity: sizeTierQty,
			size_price_per_unit: sizeTierUnit,
			size_total_price: sizeTierTotal,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_locations: printLocations,
			isValid: validateCurrentOptions(),
		};
	}, [size, sizeTierId, sizeTierQty, sizeTierUnit, sizeTierTotal, color, material, optionGroups, printingMethod, printLocations, validateCurrentOptions]);

	useImperativeHandle(ref, () => ({
		getOptions: () => getOptionsObj(),
		validate: () => validateCurrentOptions(),
	}));

	// load apiData from props (both pages)
	useEffect(() => {
		setApiError(null);
		setFormLoading(true);

		try {
			if (!productData) throw new Error("لا توجد بيانات للمنتج");
			setApiData(productData);

			// init groups
			if (Array.isArray(productData?.options)) {
				const out: Record<string, string> = {};
				productData.options.forEach((o: any) => {
					const k = String(o.option_name || "").trim();
					if (!k) return;
					if (!out[k]) out[k] = "اختر";
				});
				setOptionGroups(out);
			} else {
				setOptionGroups({});
			}

			setPrintingMethod("اختر");
			setPrintLocations([]);
			setSizeTierId(null);
			setSizeTierQty(null);
			setSizeTierUnit(null);
			setSizeTierTotal(null);

			setDesignFile(null);
			setDesignSendMethod(null);
			setDesignUploading(false);
		} catch (err: any) {
			setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
			setApiData(null);
		} finally {
			setFormLoading(false);
		}
	}, [productData]);

	// push changes to parent (product page summary)
	const pushTimer = useRef<any>(null);
	useEffect(() => {
		if (!onOptionsChange) return;
		if (pushTimer.current) clearTimeout(pushTimer.current);

		pushTimer.current = setTimeout(() => {
			onOptionsChange(getOptionsObj());
		}, 80);

		return () => clearTimeout(pushTimer.current);
	}, [getOptionsObj, onOptionsChange]);

	// CART MODE: load saved options (⚠️ backend may have old selected_options; we try best)
	// const loadSavedOptions = useCallback(async () => {
	// 	if (!cartItemId) return;
	// 	if (!apiData) return;

	// 	try {
	// 		const saved = await fetchCartItemOptions(cartItemId);
	// 		if (!saved) return;

	// 		// Prefer new backend fields if exist; else fallback to selected_options
	// 		// (لو الباك إند رجّع size_id وغيره، انت ممكن توسّع restore هنا)
	// 		const sizeFrom = extractValueFromOptions(saved.selected_options, "المقاس");
	// 		const colorFrom = extractValueFromOptions(saved.selected_options, "اللون");
	// 		const matFrom = extractValueFromOptions(saved.selected_options, "الخامة");
	// 		const pmFrom = extractValueFromOptions(saved.selected_options, "طريقة الطباعة");

	// 		const qtyFrom = extractValueFromOptions(saved.selected_options, "كمية المقاس");
	// 		const totalFrom = extractValueFromOptions(saved.selected_options, "سعر المقاس الإجمالي");
	// 		const unitFrom = extractValueFromOptions(saved.selected_options, "سعر الوحدة");
	// 		const locsFrom = extractValuesFromOptions(saved.selected_options, "مكان الطباعة");

	// 		setSize(sizeFrom || saved.size || "اختر");
	// 		setColor(colorFrom || (saved.color?.name || saved.color) || "اختر");
	// 		setMaterial(matFrom || saved.material || "اختر");
	// 		setPrintingMethod(pmFrom || "اختر");
	// 		setPrintLocations(locsFrom || []);

	// 		const q = qtyFrom ? Number(qtyFrom) : null;
	// 		const t = totalFrom ? Number(totalFrom) : null;
	// 		const u = unitFrom ? Number(unitFrom) : null;

	// 		// restore tier by qty if possible
	// 		if (q && apiData?.sizes) {
	// 			const sz = apiData.sizes.find((s: any) => s?.name === (sizeFrom || saved.size));
	// 			const tier = (sz?.tiers || []).find((x: any) => Number(x?.quantity) === q) || null;

	// 			const tierUnit = num(tier?.price_per_unit) || num(u);
	// 			const backendTotal = num(tier?.total_price);
	// 			const computed = q && tierUnit ? q * tierUnit : 0;

	// 			setSizeTierId(tier?.id ?? null);
	// 			setSizeTierQty(tier?.quantity ?? q ?? null);
	// 			setSizeTierUnit(tierUnit || null);
	// 			setSizeTierTotal(backendTotal > 0 ? backendTotal : t && t > 0 ? t : computed > 0 ? computed : null);
	// 		}

	// 		// restore option groups (only real groups, skip "system" ones)
	// 		const out: Record<string, string> = {};
	// 		Object.keys(groupedOptions).forEach((g) => (out[g] = "اختر"));

	// 		if (Array.isArray(saved.selected_options)) {
	// 			saved.selected_options.forEach((opt: any) => {
	// 				const name = String(opt.option_name || "").trim();
	// 				const value = String(opt.option_value || "").trim();
	// 				if (!name || !value) return;

	// 				// skip system fields (should not be in new version anyway)
	// 				if (["المقاس", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة", "كمية المقاس", "سعر المقاس الإجمالي", "سعر الوحدة"].includes(name)) return;

	// 				if (Object.prototype.hasOwnProperty.call(out, name)) out[name] = value;
	// 			});
	// 		}

	// 		setOptionGroups(out);
	// 		setShowSaveButton(false);
	// 	} catch {
	// 		// ignore
	// 	}
	// }, [cartItemId, apiData, groupedOptions]);

	useEffect(() => {
		if (!cartItemId || !apiData) return;
		// loadSavedOptions();
	}, [cartItemId, apiData]);

	const markDirty = () => {
		if (!cartItemId) return; // only show save UI in cart mode
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const handleSizeChange = (value: string) => {
		setSize(value);
		setSizeTierId(null);
		setSizeTierQty(null);
		setSizeTierUnit(null);
		setSizeTierTotal(null);
		markDirty();
	};

	// compute total if backend total missing
	const handleTierChange = (tierIdStr: string) => {
		const tierId = Number(tierIdStr);
		const tier = sizeTiers.find((t: any) => Number(t?.id) === tierId) || null;

		const qty = tier ? Number(tier.quantity) : null;
		const unit = tier ? num(tier.price_per_unit) : null;
		const backendTotal = tier ? num(tier.total_price) : 0;

		const computedTotal = qty && unit ? qty * unit : 0;
		const finalTotal = backendTotal > 0 ? backendTotal : computedTotal > 0 ? computedTotal : null;

		setSizeTierId(tier ? Number(tier.id) : null);
		setSizeTierQty(qty);
		setSizeTierUnit(unit);
		setSizeTierTotal(finalTotal);

		markDirty();
	};

	const saveAllOptions = async () => {
		if (!cartItemId || !apiData) return;

		const opts = getOptionsObj();

		// ✅ NEW RULES payload
		const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		const idsPayload = buildIdsPayload(apiData, opts);

		const qty = Math.max(1, Number(opts?.size_quantity || 1));

		const payload: any = {
			...idsPayload,
			selected_options,
			quantity: needSizeTier ? qty : undefined,
		};

		try {
			setSaving(true);
			const success = await updateCartItem(cartItemId, payload);
			if (success) {
				setSavedSuccessfully(true);
				setShowSaveButton(false);
				setTimeout(() => setSavedSuccessfully(false), 2500);
				toast.success("تم حفظ التغييرات ✅");
			}
		} finally {
			setSaving(false);
		}
	};

	const resetAllOptions = () => {
		setSize("اختر");
		setColor("اختر");
		setMaterial("اختر");

		const resetGroups: Record<string, string> = {};
		Object.keys(groupedOptions).forEach((g) => (resetGroups[g] = "اختر"));
		setOptionGroups(resetGroups);

		setPrintingMethod("اختر");
		setPrintLocations([]);

		setSizeTierId(null);
		setSizeTierQty(null);
		setSizeTierUnit(null);
		setSizeTierTotal(null);

		setDesignFile(null);
		setDesignSendMethod(null);
		setDesignUploading(false);

		markDirty();
	};

	// design service (show only if "خدمة تصميم" === "لدى تصميم")
	const designServiceValue = String(optionGroups?.["خدمة تصميم"] ?? optionGroups?.["خدمة التصميم"] ?? "اختر").trim();
	const showDesignBoxes = designServiceValue === "لدى تصميم";

	const whatsappFromSocial = getSocialValue(socialMedia, "whatsapp");
	const emailFromSocial = getSocialValue(socialMedia, "email");

	const waText = encodeURIComponent(`مرحباً، لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`);

	const whatsappHref = useMemo(() => {
		if (!whatsappFromSocial) return null;

		if (/^https?:\/\//i.test(whatsappFromSocial)) {
			if (/wa\.me\//i.test(whatsappFromSocial) && !/text=/i.test(whatsappFromSocial)) {
				const join = whatsappFromSocial.includes("?") ? "&" : "?";
				return `${whatsappFromSocial}${join}text=${waText}`;
			}
			return whatsappFromSocial;
		}

		const phone = whatsappFromSocial.replace(/[^\d]/g, "");
		if (!phone) return null;
		return `https://wa.me/${phone}?text=${waText}`;
	}, [whatsappFromSocial, waText]);

	const emailHref = useMemo(() => {
		if (!emailFromSocial) return null;
		return `mailto:${emailFromSocial}?subject=${encodeURIComponent("ملف تصميم")}&body=${encodeURIComponent(
			`لدي تصميم للمنتج رقم ${productId}${cartItemId ? ` - عنصر سلة: ${cartItemId}` : ""}`
		)}`;
	}, [emailFromSocial, productId, cartItemId]);


	const uploadDesignFileCart = async () => {
		if (!API_URL) return toast.error("API غير متوفر");
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!cartItemId) return toast.error("لا يمكن رفع الملف بدون cart_item_id");
		if (!designFile) return toast.error("اختر ملف التصميم أولاً");

		try {
			setDesignUploading(true);

			const fd = new FormData();
			fd.append("img", designFile);
			fd.append("cart_item_id", String(cartItemId));

			const res = await fetch(`${API_URL}/upload-image`, {
				method: "POST",
				headers: { 
					Authorization: `Bearer ${token}`,
					"Accept-Language": language,
					Accept: "application/json"
				},
				body: fd,
			});

			const json = await res.json().catch(() => null);
			if (!res.ok || (json && json.status === false)) throw new Error(json?.message || "فشل رفع الملف");

			toast.success("تم رفع الملف وربطه بعنصر السلة ✅");
		} catch (e: any) {
			toast.error(e?.message || "حدث خطأ أثناء رفع الملف");
		} finally {
			setDesignUploading(false);
		}
	};

	if (formLoading) return <StickerFormSkeleton />;
	if (apiError || !apiData) {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
				<p className="text-slate-700 font-extrabold">{apiError || "لا توجد بيانات للمنتج"}</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="pt-4 mt-4">
			{/* CART MODE ONLY: Save bar */}
			{cartItemId && showSaveButton && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Warning className="text-yellow-600 text-sm" />
							<p className="text-sm text-yellow-800 font-bold">{t('unsaved_changes')}</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outlined"
								size="small"
								onClick={resetAllOptions}
								startIcon={<Refresh />}
								sx={{ borderRadius: "14px", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 900 }}
							>
								{t('reset')}
							</Button>

							<Button
								variant="contained"
								size="small"
								onClick={saveAllOptions}
								disabled={saving}
								startIcon={saving ? <CircularProgress size={16} /> : <Save />}
								sx={{ borderRadius: "14px", backgroundColor: "#f59e0b", fontWeight: 900 }}
							>
								{saving ? t('saving') : t('save')}
							</Button>
						</div>
					</div>
				</motion.div>
			)}

			{cartItemId && savedSuccessfully && (
				<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
					<Alert severity="success" className="rounded-2xl" icon={<CheckCircle />}>
						{t('changes_saved')}
					</Alert>
				</motion.div>
			)}

			<div className="space-y-4">
				{needSize && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSize && size === "اختر"}>
							<InputLabel>{t('size')}</InputLabel>
							<Select value={size} onChange={(e) => handleSizeChange(e.target.value as string)} label={t('size')} className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">{t('select')}</em>
								</MenuItem>
								{apiData.sizes.map((s: any) => (
									<MenuItem key={s.id} value={s.name}>
										{s.name}
									</MenuItem>
								))}
							</Select>
							{showValidation && needSize && size === "اختر" && <FormHelperText className="text-red-500 text-xs">{t('required_field')}</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needSizeTier && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && !sizeTierId}>
							<InputLabel>{t('quantity')}</InputLabel>
							<Select value={sizeTierId ? String(sizeTierId) : "اختر"} onChange={(e) => handleTierChange(e.target.value as string)} label={t('quantity')} className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">{t('select')}</em>
								</MenuItem>

								{sizeTiers.map((t: any) => {
									const qty = num(t.quantity);
									const unit = num(t.price_per_unit);
									const backendTotal = num(t.total_price);
									const computedTotal = qty > 0 && unit > 0 ? qty * unit : 0;
									const showTotal = backendTotal > 0 ? backendTotal : computedTotal;

									return (
										<MenuItem key={t.id} value={String(t.id)}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{qty} {t('pieces')}</span>
												<span className="text-xs font-black text-slate-700">{num(showTotal).toFixed(2)} {t('currency')}</span>
											</div>
										</MenuItem>
									);
								})}
							</Select>

							{showValidation && !sizeTierId && <FormHelperText className="text-red-500 text-xs">{t('required_field')}</FormHelperText>}

							{!!sizeTierId && <FormHelperText className="text-slate-600 text-xs">{t('unit_price')}: {num(sizeTierUnit).toFixed(2)} {t('currency')} — {t('total')}: {num(sizeTierTotal).toFixed(2)} {t('currency')}</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needColor && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needColor && color === "اختر"}>
							<InputLabel>اللون</InputLabel>
							<Select
								value={color}
								onChange={(e) => {
									setColor(e.target.value as string);
									markDirty();
								}}
								label="اللون"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.colors.map((c: any) => (
									<MenuItem key={c.id} value={c.name}>
										<div className="flex items-center gap-2">
											{c.hex_code && <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex_code }} />}
											<span>{c.name}</span>
										</div>
									</MenuItem>
								))}
							</Select>
							{showValidation && needColor && color === "اختر" && <FormHelperText className="text-red-500 text-xs">{t('required_field')}</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needMaterial && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needMaterial && material === "اختر"}>
							<InputLabel>الخامة</InputLabel>
							<Select
								value={material}
								onChange={(e) => {
									setMaterial(e.target.value as string);
									markDirty();
								}}
								label="الخامة"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.materials.map((m: any) => (
									<MenuItem key={m.id} value={m.name}>
										<div className="flex items-center justify-between gap-2 w-full">
											<span>{m.name}</span>
											{Number(m.additional_price || 0) > 0 ? (
												<span className="text-xs font-black text-amber-700">+ {m.additional_price}</span>
											) : (
												<span className="text-xs font-black text-slate-500">0</span>
											)}
										</div>
									</MenuItem>
								))}
							</Select>
							{showValidation && needMaterial && material === "اختر" && <FormHelperText className="text-red-500 text-xs">{t('required_field')}</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{/* option groups */}
				{Object.keys(groupedOptions).map((groupName) => {
					const items = groupedOptions[groupName] || [];
					const required = items.some((x: any) => Boolean(x?.is_required));
					const currentValue = optionGroups?.[groupName] || "اختر";
					const fieldError = showValidation && required && currentValue === "اختر";

					return (
						<Box key={groupName}>
							<FormControl fullWidth size="small" required={required} error={fieldError}>
								<InputLabel>{groupName}</InputLabel>
								<Select
									value={currentValue}
									onChange={(e) => {
										const value = e.target.value as string;
										setOptionGroups((prev) => ({ ...prev, [groupName]: value }));
										markDirty();

										// if design service changed -> reset method/file
										if (String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") {
											setDesignSendMethod(null);
											setDesignFile(null);
										}
									}}
									label={groupName}
									className="bg-white"
								>
									<MenuItem value="اختر" disabled>
										<em className="text-gray-600">اختر</em>
									</MenuItem>

									{items.map((o: any) => (
										<MenuItem key={o.id} value={o.option_value}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{o.option_value}</span>
												{Number(o.additional_price || 0) > 0 ? (
													<span className="text-xs font-black text-amber-700">+ {o.additional_price}</span>
												) : (
													<span className="text-xs font-black text-slate-500">0</span>
												)}
											</div>
										</MenuItem>
									))}
								</Select>

								{fieldError && <FormHelperText className="text-red-500 text-xs">{t('required_field')}</FormHelperText>}
							</FormControl>

							{/* Design boxes: show only when social values exist */}
							{(String(groupName).trim() === "خدمة تصميم" || String(groupName).trim() === "خدمة التصميم") &&
								showDesignBoxes &&
								(whatsappHref || emailHref || cartItemId) && (
									<div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-sm font-extrabold text-slate-800">أرسل ملف التصميم عبر:</p>

										<div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
											{whatsappHref && (
												<a
													href={whatsappHref}
													target="_blank"
													rel="noreferrer"
													onClick={() => setDesignSendMethod("whatsapp")}
													className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
												>
													<p className="font-black text-slate-900">WhatsApp</p>
													<p className="text-xs text-slate-500 font-bold mt-1">فتح واتساب وإرسال الملف</p>
												</a>
											)}

											{emailHref && (
												<a
													href={emailHref}
													onClick={() => setDesignSendMethod("email")}
													className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
												>
													<p className="font-black text-slate-900">Email</p>
													<p className="text-xs text-slate-500 font-bold mt-1">{emailFromSocial}</p>
												</a>
											)}

											<button
												type="button"
												onClick={() => setDesignSendMethod("upload")}
												className={[
													`rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition ${isRTL ? "text-right" : "text-left"}`,
													designSendMethod === "upload" ? "ring-2 ring-amber-300" : "",
												].join(" ")}
											>
												<p className="font-black text-slate-900">رفع الملف</p>
												<p className="text-xs text-slate-500 font-bold mt-1">رفع مباشر عبر الموقع</p>
											</button>
										</div>

										{designSendMethod === "upload" && (
											<div className="mt-4">
												<Divider className="!my-3" />
												<div className="flex flex-col gap-3">
													{/* Upload Card */}
													<div className="relative">
														<label
															className={[
																"flex flex-col items-center justify-center gap-2",
																"w-full rounded-2xl border-2 border-dashed",
																"px-6 py-7 text-center cursor-pointer transition",
																designFile
																	? "border-emerald-400 bg-emerald-50"
																	: "border-slate-300 hover:border-amber-400 hover:bg-amber-50",
															].join(" ")}
														>
															<input
																type="file"
																accept="image/*,.pdf,.ai,.psd,.eps,.svg"
																className="hidden"
																onChange={(e) => {
																	const f = e.target.files?.[0] ?? null;
																	setDesignFile(f);
																	onDesignFileChange?.(f); // ✅ مهم
																}}

															/>

															{/* Icon */}
															<div
																className={[
																	"w-12 h-12 rounded-full flex items-center justify-center text-xl",
																	designFile ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800",
																].join(" ")}
															>
																📎
															</div>

															{!designFile ? (
																<>
																	<p className="text-sm font-black text-slate-800">اسحب الملف هنا أو اضغط للاختيار</p>
																	<p className="text-xs font-bold text-slate-500">PNG, JPG, PDF, AI, PSD, SVG</p>
																</>
															) : (
																<>
																	<p className="text-sm font-black text-emerald-800">تم اختيار الملف ✅</p>
																	<p className="text-xs font-extrabold text-slate-700">
																		{designFile.name}
																		<span className="text-slate-500 font-bold">
																			{" "}
																			— {(designFile.size / 1024 / 1024).toFixed(2)} MB
																		</span>
																	</p>
																</>
															)}
														</label>

														{/* Remove */}
														{designFile && !designUploading && (
															<button
																type="button"
																onClick={() => {
																	setDesignFile(null);
																	onDesignFileChange?.(null); // ✅
																}}

																className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} text-xs font-black text-rose-700 hover:underline`}
															>
																إزالة
															</button>
														)}
													</div>
												</div>

											</div>
										)}
									</div>
								)}
						</Box>
					);
				})}

				{needPrintingMethod && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
							<InputLabel>طريقة الطباعة</InputLabel>
							<Select
								value={printingMethod}
								onChange={(e) => {
									setPrintingMethod(e.target.value as string);
									markDirty();
								}}
								label="طريقة الطباعة"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.printing_methods.map((p: any) => (
									<MenuItem key={p.id} value={p.name}>
										<div className="flex items-center justify-between gap-3 w-full">
											<span>{p.name}</span>
											<span className="text-xs font-black text-amber-700">{p.base_price}</span>
										</div>
									</MenuItem>
								))}
							</Select>

							{showValidation && printingMethod === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار طريقة الطباعة</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needPrintLocation && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && (!Array.isArray(printLocations) || printLocations.length === 0)}>
							<InputLabel>مكان الطباعة</InputLabel>
							<Select
								multiple
								value={printLocations}
								onChange={(e) => {
									setPrintLocations(e.target.value as string[]);
									markDirty();
								}}
								label="مكان الطباعة"
								className="bg-white"
								renderValue={(selected) => (Array.isArray(selected) ? selected.join("، ") : "")}
							>
								{apiData.print_locations.map((p: any) => {
									const checked = printLocations.includes(p.name);
									return (
										<MenuItem key={p.id} value={p.name}>
											<Checkbox checked={checked} />
											<ListItemText
												primary={
													<div className="flex items-center justify-between gap-3 w-full">
														<span>{p.name}</span>
														<span className="text-xs font-black text-slate-500">{p.type}</span>
													</div>
												}
											/>
										</MenuItem>
									);
								})}
							</Select>

							{showValidation && (!Array.isArray(printLocations) || printLocations.length === 0) && (
								<FormHelperText className="text-red-500 text-xs">يجب اختيار مكان الطباعة</FormHelperText>
							)}
						</FormControl>
					</Box>
				)}
			</div>

			{apiData?.options_note && (
				<div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
					<div className="flex items-start gap-2">
						<Info className="text-blue-500 text-sm mt-0.5" />
						<p className="text-sm text-blue-700 font-semibold">{apiData.options_note}</p>
					</div>
				</div>
			)}
		</motion.div>
	);
});

/* ------------------------------------------
 * ProductPageClient (default export)
 * ------------------------------------------ */

export default function ProductPageClient() {
	const { id } = useParams();
	const productId = id as string;

	const { authToken: token, user, userId } = useAuth() as any;
	const currentUserId: number | null = typeof userId === "number" ? userId : user?.id ?? null;

	const { addToCart } = useCart();
	const { homeData } = useAppContext();
	const router = useRouter();
	const { direction, language, t } = useLanguage();
	const isRTL = direction === "rtl";

	const stickerFormRef = useRef<StickerFormHandle | null>(null);

	const [product, setProduct] = useState<any>(null);
	const [apiData, setApiData] = useState<any>(null);

	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const [isFavorite, setIsFavorite] = useState(false);
	const [activeTab, setActiveTab] = useState<TabKey>("options");

	const [showValidation, setShowValidation] = useState(false);

	// ✅ RULE (3): i have design upload AFTER add-to-cart using /upload-image + cart_item_id
	const [designMode, setDesignMode] = useState<"have_design" | "need_design" | "none">("none");
	const [designFile, setDesignFile] = useState<File | null>(null);
	const [uploadingDesign, setUploadingDesign] = useState(false);

	const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
		size: "اختر",
		size_tier_id: null,
		size_quantity: null,
		size_price_per_unit: null,
		size_total_price: null,

		color: "اختر",
		material: "اختر",
		optionGroups: {},
		printing_method: "اختر",
		print_locations: [],
		isValid: false,
	});

	const API_URL = process.env.NEXT_PUBLIC_API_URL;



	const [reviewsPage, setReviewsPage] = useState(1);
	const [reviewsRatingFilter, setReviewsRatingFilter] = useState<number | "">("");
	const [reviewsSortBy, setReviewsSortBy] = useState<"rating" | "created_at">("created_at");
	const [reviewsSortDir, setReviewsSortDir] = useState<"asc" | "desc">("desc");
	const [stickerDesignFile, setStickerDesignFile] = useState<File | null>(null);

	// Product description FAQ state
	const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
	const [isTermsOpen, setIsTermsOpen] = useState(false);

	const [myRating, setMyRating] = useState<number>(5);
	const [myComment, setMyComment] = useState<string>("");

	// fetch product
	useEffect(() => {
		let mounted = true;

		async function fetchProduct() {
			if (!productId || !API_URL) return;

			setLoading(true);
			setErrorMsg(null);

			try {
				const res = await fetch(`${API_URL}/products/${productId}`, {
					headers: {
						... (token ? { Authorization: `Bearer ${token}` } : {}),
						'Accept-Language': language
					},
					cache: "no-store",
				});

				if (!res.ok) throw new Error("not_found");

				const json = await res.json();
				const prod = json?.data ?? null;

				if (!mounted) return;

				setProduct(prod);
				setApiData(json?.data);

			

				const saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
				setIsFavorite(!!prod && saved.includes(prod.id));
			} catch (e: any) {
				if (!mounted) return;
				setErrorMsg(e?.message === "not_found" ? t('error_loading') : t('error_loading'));
			} finally {
				if (mounted) setLoading(false);
			}
		}

		fetchProduct();
		return () => {
			mounted = false;
		};
	}, [productId, token, API_URL, language]);

	const hasSeededDefaultRef = useRef(false);

	useEffect(() => {
		if (Array.isArray(product?.reviews) && product.reviews.length > 0) {
			hasSeededDefaultRef.current = true;
		}
	}, [product?.id]);

	

	const hasOptions = useMemo(() => {
		if (!apiData) return false;

		const hasSizes = Array.isArray(apiData?.sizes) && apiData.sizes.length > 0;
		const hasColors = Array.isArray(apiData?.colors) && apiData.colors.length > 0;
		const hasMaterials = Array.isArray(apiData?.materials) && apiData.materials.length > 0;

		const hasExtraOptions = Array.isArray(apiData?.options) && apiData.options.length > 0;
		const hasPrinting = Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0;

		return hasSizes || hasColors || hasMaterials || hasExtraOptions || hasPrinting || Array.isArray(apiData?.print_locations);
	}, [apiData]);

	useEffect(() => {
		if (!loading) {
			if (activeTab === "options" && !hasOptions) setActiveTab("reviews");
		}
	}, [loading, hasOptions, activeTab]);

	const warrantyText = useMemo(() => {
		const w = apiData?.warranty;
		if (!w) return null;

		const months = w?.months;
		if (typeof months === "number" && months > 0) return `${months} أشهر ضمان`;

		const raw = String(w?.display_text || "").trim();
		if (!raw) return null;
		if (/^أشهر\s+ضمان$/.test(raw) || raw === "أشهر ضمان") return null;

		return raw;
	}, [apiData]);

	

	const getSelectedOptions = async () => {
		if (stickerFormRef.current?.getOptions) {
			const opts = await stickerFormRef.current.getOptions();
			setSelectedOptions(opts);
			return opts;
		}
		return selectedOptions;
	};

	// base price from tier total
	const basePrice = useMemo(() => {
		const total = computeSizeBaseTotal(selectedOptions);
		return total > 0 ? total : 0;
	}, [selectedOptions]);

	// ✅ extras based on optionGroups only (design one-time is handled)
	const extrasTotal = useMemo(() => {
		if (!apiData) return 0;
		const selected = buildSelectedOptionsWithPrice(apiData, selectedOptions);
		return selected.reduce((sum, o) => sum + num(o.additional_price), 0);
	}, [apiData, selectedOptions]);

	const displayTotal = useMemo(() => {
		const total = basePrice + extrasTotal;
		return total > 0 ? total : 0;
	}, [basePrice, extrasTotal]);
 
	const handleAddToCart = async () => {
		setShowValidation(true);

		const opts = await getSelectedOptions();
		

	

		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!API_URL) return toast.error("API غير متوفر");

		const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		const idsPayload = buildIdsPayload(apiData, opts);

		const qty = Math.max(1, Number(opts?.size_quantity || 1));

		const cartData = {
			product_id: product.id,
			quantity: qty,
			...idsPayload,
			selected_options,
			design_service_id: null,
			is_sample: false,
			note: "",
			image_design: null,
		};

		try {
			const res: any = await addToCart(product.id, cartData);
 
			const cartItemId =
				Number(res?.data?.cart_item_id) ||
				Number(res?.data?.id) ||
				Number(res?.cart_item_id) ||
				Number(res?.id) ||
				null;

		

			
			

		} catch {
			toast.error("حدث خطأ أثناء إضافة المنتج للسلة");
		}
	};

	const handleBuyNow = async () => {
		setShowValidation(true);

		const opts = await getSelectedOptions();
		

		

		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!API_URL) return toast.error("API غير متوفر");

		// const selected_options = buildSelectedOptionsWithPrice(apiData, opts);
		// const idsPayload = buildIdsPayload(apiData, opts);

		const qty = Math.max(1, Number(opts?.size_quantity || 1));

		const cartData = {
			product_id: product.id,
			quantity: qty,
			// ...idsPayload,
			// selected_options,
			// design_service_id: null,
			// is_sample: false,
			note: "",
			image_design: null,
		};

		try {
			const res: any = await addToCart(product.id, cartData);
 
			const cartItemId =
				Number(res?.data?.cart_item_id) ||
				Number(res?.data?.id) ||
				Number(res?.cart_item_id) ||
				Number(res?.id) ||
				null;

			const fileToUpload = designFile || stickerDesignFile;

			if (fileToUpload) {
				if (!cartItemId) {
					toast.error(t('error_loading'));
					router.push("/cart");
					return;
				}

			
			}

			toast.success(t('changes_saved'));
			router.push("/cart");
		} catch {
			toast.error(t('error_loading'));
		}
	};

	const toggleFavorite = async () => {
		if (!token) return toast.error("يجب تسجيل الدخول أولاً");
		if (!product) return;

		const newState = !isFavorite;
		setIsFavorite(newState);

		let saved = JSON.parse(localStorage.getItem("favorites") || "[]") as number[];
		if (newState) {
			if (!saved.includes(product.id)) saved.push(product.id);
		} else {
			saved = saved.filter((pid) => pid !== product.id);
		}
		localStorage.setItem("favorites", JSON.stringify(saved));

		try {
			const res = await fetch(`${API_URL}/favorites/toggle`, {
				method: "POST",
				headers: { 
					"Content-Type": "application/json", 
					Authorization: `Bearer ${token}`,
					"Accept-Language": language,
					Accept: "application/json"
				},
				body: JSON.stringify({ product_id: product.id }),
			});

			const data = await res.json();
			if (!res.ok || !data.status) {
				setIsFavorite(!newState);
				toast.error(data.message || "فشل تحديث المفضلة");
			} else {
				toast.success(data.message || "تم تحديث المفضلة");
			}
		} catch {
			setIsFavorite(!newState);
			toast.error("حدث خطأ أثناء تحديث المفضلة");
		}
	};

	const categories2 = homeData?.sub_categories || [];




	

	// Render states
	if (loading) return <ProductPageSkeleton />;

	if (errorMsg || !product) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center px-4" >
				<div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
							<FiAlertTriangle className="text-rose-600" size={22} />
						</div>
						<div>
							<p className="font-extrabold text-slate-900">{t('error_loading')}</p>
							<p className="text-sm text-slate-600 mt-1">{errorMsg || t('error_loading')}</p>
						</div>
					</div>
					<button
						onClick={() => location.reload()}
						className="mt-4 w-full rounded-2xl bg-slate-900 text-white py-3 font-extrabold hover:opacity-95 transition"
					>
						{t('refresh')}
					</button>
				</div>
			</div>
		);
	}






	return (
		<>
			<section className="container md:pt-8 md:pb-24 pt-5 pb-13" >
				<motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4">
					<CustomSeparator proName={product.name} />
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Left: Info */}
					<motion.div variants={fadeUp} initial="hidden" animate="show" className=" space-y-5 lg:col-span-5">
						<h1 className="text-slate-900  text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug">{product.name}</h1>

						<div className="mt-1 md:mt-3 flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<HearComponent
									liked={isFavorite}
									onToggleLike={toggleFavorite}
									ClassName="text-slate-500"
									ClassNameP="border border-slate-200 hover:border-slate-300"
								/>
								<button
									onClick={handleBuyNow}
									aria-label={t('buy_now')}
									className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-pro text-white hover:bg-pro/90 transition-colors duration-200 font-semibold text-sm ${isRTL ? "flex-row-reverse" : ""}`}
								>
									<span>{t('buy_now')}</span>
									<ShoppingCart className="w-4 h-4" />
								</button>
							</div>

							{/* <div className="flex items-center gap-2">
								<RatingStars average_ratingc={product.average_rating || 0} reviewsc={product.reviews || []} />
							</div> */}
						</div>

						{/* Product Description FAQ */}
						<div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
							{/* Title */}
							<button
								aria-label="toggle description"
								onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
								className={`w-full flex items-center justify-between gap-3 p-1 px-2 md:p-5  cursor-pointer bg-slate-50 transition`}
							>
								<div className={`min-w-0 flex-1 flex items-center gap-2`}>
									<Package className="w-5 h-5 text-pro-max shrink-0 " />
									<div>
										<p className="text-slate-900 font-extrabold text-base md:text-lg">
											{t('description')}
										</p>
									
									</div>
								</div>

								<motion.span
									animate={{ rotate: isDescriptionOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-10 w-10 rounded-lg bg-slate-50 text-slate-700 ring-0 sm:ring-1 ring-slate-200 shrink-0"
								>
									<IoIosArrowDown />
								</motion.span>
							</button>

							{/* Description Content */}
							<AnimatePresence initial={false}>
								{isDescriptionOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div className="px-4 md:px-5 pb-4">
											<div className=" p-4 ">
												<div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.description || "" }} />
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Instructions FAQ */}
						<div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition mt-1 md:mt-4">
							{/* Title */}
							<button
								aria-label="toggle instructions"
								onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
								className={`w-full flex items-center justify-between gap-3 p-1 px-2 md:p-5  cursor-pointer bg-slate-50 transition`}
							>
								<div className={`min-w-0 flex-1 flex items-center gap-2 `}>
									<BookOpen className="w-5 h-5 text-pro-max shrink-0" />
									<div>
										<p className="text-slate-900 font-extrabold text-base md:text-lg">
											{t('instructions')}
										</p>
									</div>
								</div>

								<motion.span
									animate={{ rotate: isInstructionsOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-10 w-10 rounded-lg bg-slate-50 text-slate-700 ring-0 sm:ring-1 ring-slate-200 shrink-0"
								>
									<IoIosArrowDown />
								</motion.span>
							</button>

							{/* Instructions Content */}
							<AnimatePresence initial={false}>
								{isInstructionsOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div className="px-4 md:px-5 pb-4">
											<div className=" p-4 ">
												<div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.instructions || apiData?.instructions || "" }} />
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Terms and Conditions FAQ */}
						<div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition mt-1 md:mt-4">
							{/* Title */}
							<button
								aria-label="toggle terms"
								onClick={() => setIsTermsOpen(!isTermsOpen)}
								className={`w-full flex items-center justify-between gap-3 p-1 px-2 md:p-5  cursor-pointer bg-slate-50 transition`}
							>
								<div className={`min-w-0 flex-1 flex items-center gap-2 `}>
									<FileText className="w-5 h-5 text-pro-max shrink-0" />
									<div>
										<p className="text-slate-900 font-extrabold text-base md:text-lg">
											{t('terms_conditions')}
										</p>
									</div>
								</div>

								<motion.span
									animate={{ rotate: isTermsOpen ? 180 : 0 }}
									transition={{ type: "spring", stiffness: 260, damping: 20 }}
									className="grid place-items-center h-10 w-10 rounded-lg bg-slate-50 text-slate-700 ring-0 sm:ring-1 ring-slate-200 shrink-0"
								>
									<IoIosArrowDown />
								</motion.span>
							</button>

							{/* Terms Content */}
							<AnimatePresence initial={false}>
								{isTermsOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<div className="px-4 md:px-5 pb-4">
											<div className=" p-4 ">
												<div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: product.terms || apiData?.terms || "" }} />
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

					

					
						


					</motion.div>

					{/* Right: Gallery */}
					<motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-7">
						<div className="lg:sticky lg:top-[150px]">
							<ProductGallery mainImage={product.image} images={product.images} />
						</div>
					</motion.div>
				</div>

				{/* Similar products */}
				<div className="mt-10">
					{product && categories2.length > 0 && (
						<section>
							{(() => {
								const currentCategory = categories2.find((cat: any) => cat.products?.some((p: any) => p.id === product.id));
								const base = currentCategory?.products?.filter((p: any) => p.id !== product.id) || [];
								const fallback = categories2.flatMap((cat: any) => cat.products || []).filter((p: any) => p.id !== product.id).slice(0, 12);
								const list = base.length ? base : fallback;
								if (!list.length) return null;

								return (
									<div className="mb-10">
										<InStockSlider
		

											title={product.name.split(/\s+/)[0]}
											inStock={list}
											CardComponent={(props: any) => <ProductCard {...props} product={product} classNameHome="hidden" className2="hidden" />}
										/>
									</div>
								);
							})()}
						</section>
					)}
				</div>
			</section>

			{/* Bottom bar */}
			<div className="fixed bottom-0 start-0 end-0 z-50">
				<div className="border-t border-slate-200 bg-white/80 backdrop-blur">
					<div className="container py-3">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-0 py-3 md:px-4 md:py-4">
							<div className="flex items-center justify-between gap-1 md:gap-3">
								{/* Left */}
								<div className="max-md:w-full flex items-center gap-3 min-w-0 ps-3">
									<div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
										<Image src={product.image || "/images/o1.jpg"} alt={product.name} fill className="object-cover" />
									</div>

								

							<div className="flex  sm:gap-2 flex-col">
							<p className="text-xs md:text-sm font-black text-slate-900 line-clamp-2">{product.name}</p>
										<p className="text-lg text-gray-500 leading-none sm:mt-1">{displayTotal.toFixed(2)}</p>
								
							</div>
										
								</div>
								{/* Right */}
			

									<div className="min-w-[130px] md:min-w-[150px]">
										<ButtonComponent
											className="scale-[.8]"
											title={t('add_to_cart')}
											onClick={handleAddToCart}
										/>
								
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="h-16" />
		</>
	);
}
