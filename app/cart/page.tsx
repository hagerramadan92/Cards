"use client";

import Link from "next/link";
import Image from "next/image";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { BsTrash3 } from "react-icons/bs";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { IoIosCloseCircle } from "react-icons/io";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useCart } from "@/src/context/CartContext";
import CoBon from "@/components/cobon";
import Button from "@mui/material/Button";
import CartSkeleton from "@/components/skeletons/CartSkeleton";
import { Box, FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert } from "@mui/material";
import { motion } from "framer-motion";
import { Save, CheckCircle, Warning, Info, Refresh } from "@mui/icons-material";
import { StickerFormSkeleton } from "../../components/skeletons/HomeSkeletons";

interface StickerFormProps {
	cartItemId?: number;
	productId: number;
	productData?: any; // ✅ pass product from cart to avoid refetch
	onOptionsChange?: (options: any) => void;
	showValidation?: boolean;
}

type SelectedOpt = { option_name: string; option_value: string; additional_price?: number };

function n(v: any) {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
}

function money(v: number) {
	return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeParseSelectedOptions(raw: any): SelectedOpt[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw as SelectedOpt[];
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as SelectedOpt[]) : [];
		} catch {
			return [];
		}
	}
	return [];
}

function pickBasePrice(p: any) {
	const price = n(p?.price);
	const finalPrice = n(p?.final_price);
	const lowest = n(p?.lowest_price);

	if (p?.has_discount) {
		return finalPrice > 0 ? finalPrice : price > 0 ? price : lowest;
	}

	return price > 0 ? price : finalPrice > 0 ? finalPrice : lowest;
}

function computeExtrasFromSelectedOptions(item: any, p: any) {
	const selectedOptions = safeParseSelectedOptions(item.selected_options);

	// ✅ primary: additional_price already stored
	let extras = 0;
	let hasAnyAdditional = false;
	for (const opt of selectedOptions) {
		if (typeof opt?.additional_price !== "undefined") {
			extras += n(opt.additional_price);
			hasAnyAdditional = true;
		}
	}
	if (hasAnyAdditional) return extras;

	// fallback
	const productOptions = Array.isArray(p?.options) ? p.options : [];
	for (const sel of selectedOptions) {
		const match = productOptions.find(
			(x: any) =>
				String(x.option_name).trim() === String(sel.option_name).trim() &&
				String(x.option_value).trim() === String(sel.option_value).trim()
		);
		if (match) extras += n(match.additional_price);
	}

	const colors = Array.isArray(p?.colors) ? p.colors : [];
	const selectedColor = selectedOptions.find((o) => o.option_name?.includes("اللون"))?.option_value;
	if (selectedColor) {
		const c = colors.find((x: any) => String(x.name).trim() === String(selectedColor).trim());
		if (c) extras += n(c.additional_price);
	}

	const materials = Array.isArray(p?.materials) ? p.materials : [];
	const selectedMat = selectedOptions.find((o) => o.option_name?.includes("الخامة"))?.option_value;
	if (selectedMat) {
		const m = materials.find((x: any) => String(x.name).trim() === String(selectedMat).trim());
		if (m) extras += n(m.additional_price);
	}

	const printingMethods = Array.isArray(p?.printing_methods) ? p.printing_methods : [];
	const selectedPrintMethod = selectedOptions.find((o) => o.option_name?.includes("طريقة الطباعة"))?.option_value;
	if (selectedPrintMethod) {
		const pm = printingMethods.find((x: any) => String(x.name).trim() === String(selectedPrintMethod).trim());
		if (pm) extras += n(pm.pivot_price ?? pm.base_price);
	}

	const printLocations = Array.isArray(p?.print_locations) ? p.print_locations : [];
	const selectedLocations = selectedOptions
		.filter((o) => o.option_name?.includes("مكان الطباعة"))
		.map((o) => o.option_value)
		.filter(Boolean);

	if (selectedLocations.length) {
		for (const locName of selectedLocations) {
			const loc = printLocations.find((x: any) => String(x.name).trim() === String(locName).trim());
			if (loc) extras += n(loc.pivot_price ?? loc.additional_price);
		}
	}

	return extras;
}

/**
 * ✅ FIX: tiers must affect BOTH quantity and line total
 * - Read tierQty + tierTotal from selected_options
 * - Use tierQty as "effective qty" (for display)
 * - Use tierTotal as base line total (then add extras * qty)
 */
function computePricing(item: any) {
	const p = item.product || {};
	const selected = safeParseSelectedOptions(item.selected_options);

	const tierQty = n(selected.find((o) => o.option_name?.includes("كمية المقاس"))?.option_value);
	const tierTotal = n(selected.find((o) => o.option_name?.includes("سعر المقاس الإجمالي"))?.option_value);

	// ✅ effective quantity for pricing/display
	const qty = tierQty > 0 ? tierQty : n(item.quantity || 1);

	const apiUnit = n(item.price_per_unit);
	const apiLine = n(item.line_total);

	// base product price
	const base = pickBasePrice(p);

	// extras from options
	const extras = computeExtrasFromSelectedOptions(item, p);

	// ✅ if tierTotal exists => it replaces base line total (size price already computed by backend tier)
	const baseLineFromTier = tierTotal > 0 ? tierTotal : base * qty;

	// final line = baseLine + extras*qty
	const lineAfterOptions = baseLineFromTier + extras * qty;

	// unit after options (for UI)
	const unitAfterOptions = qty > 0 ? lineAfterOptions / qty : 0;

	// discounted vs original (UI only)
	const originalBaseUnit = n(p?.price) > 0 ? n(p?.price) : base;
	const discountBaseUnit = n(p?.final_price) > 0 ? n(p?.final_price) : base;

	const showRealProductPrice = {
		discount: !!p?.has_discount,
		unit_after_options: unitAfterOptions,
		original_unit_after_options: originalBaseUnit + extras,
		discount_unit_after_options: discountBaseUnit + extras,
		extras,
		base_used: base,
		tier_qty: tierQty,
		tier_total: tierTotal,
	};

	// ✅ Always prefer computed values (fallback to API if missing)
	const unit = unitAfterOptions > 0 ? unitAfterOptions : apiUnit;
	const line = lineAfterOptions > 0 ? lineAfterOptions : apiLine;

	return { unit, line, showRealProductPrice, effectiveQty: qty };
}

function productNeedsSelection(p: any) {
	return (
		(p?.sizes?.length ?? 0) > 0 ||
		(p?.colors?.length ?? 0) > 0 ||
		(p?.materials?.length ?? 0) > 0 ||
		(p?.options?.length ?? 0) > 0 ||
		(p?.printing_methods?.length ?? 0) > 0 ||
		(p?.print_locations?.length ?? 0) > 0
	);
}

function missingRequiredFields(item: any) {
	const p = item.product || {};
	const selected = safeParseSelectedOptions(item.selected_options);

	const hasSize = (p?.sizes?.length ?? 0) > 0;
	const hasColors = (p?.colors?.length ?? 0) > 0;
	const hasMaterials = (p?.materials?.length ?? 0) > 0;

	const requiredOpts = (Array.isArray(p?.options) ? p.options : []).filter((o: any) => o.is_required);
	const miss: any[] = [];

	if (hasSize && !selected.some((o) => o.option_name?.includes("المقاس"))) miss.push("المقاس");
	if (hasColors && !selected.some((o) => o.option_name?.includes("اللون"))) miss.push("اللون");
	if (hasMaterials && !selected.some((o) => o.option_name?.includes("الخامة"))) miss.push("الخامة");

	const requiredNames = Array.from(new Set(requiredOpts.map((o: any) => String(o.option_name).trim())));
	for (const name of requiredNames) {
		const ok = selected.some((s) => String(s.option_name).trim() === name && String(s.option_value).trim());
		if (!ok) miss.push(name);
	}

	if ((p?.printing_methods?.length ?? 0) > 0 && !selected.some((o) => o.option_name?.includes("طريقة الطباعة")))
		miss.push("طريقة الطباعة");

	if ((p?.print_locations?.length ?? 0) > 0 && !selected.some((o) => o.option_name?.includes("مكان الطباعة")))
		miss.push("مكان الطباعة");

	// ✅ if selected size has tiers => require tier selection too
	const sizeName = selected.find((o) => o.option_name?.includes("المقاس"))?.option_value;
	const sizeObj = sizeName ? (p?.sizes || []).find((s: any) => String(s.name).trim() === String(sizeName).trim()) : null;
	if (sizeObj?.tiers?.length) {
		if (!selected.some((o) => o.option_name?.includes("كمية المقاس"))) miss.push("كمية المقاس");
	}

	return miss;
}

export default function CartPage() {
	const router = useRouter();
	const { cart, cartCount, removeFromCart, updateQuantity, loading } = useCart();

	if (loading) return <CartSkeleton />;

	if (!cart || cart.length === 0) {
		return (
			<div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]" dir="rtl">
				<Image src="/images/cart2.webp" alt="empty cart" width={300} height={250} />
				<h2 className="text-2xl font-bold mb-6 text-gray-700">العربة فارغة</h2>
				<Link href="/" className="bg-pro text-white py-3 px-8 rounded-2xl hover:bg-pro-max transition text-lg font-bold">
					العودة للتسوق
				</Link>
			</div>
		);
	}

	const computed = useMemo(() => {
		const items = cart.map((it: any) => {
			const pr = computePricing(it);
			return {
				...it,
				_unit: pr.unit,
				_line: pr.line,
				_real: pr.showRealProductPrice,
				_effectiveQty: pr.effectiveQty,
			};
		});

		const subtotal = items.reduce((acc: number, it: any) => acc + n(it._line), 0);
		return { items, subtotal, finalTotal: subtotal };
	}, [cart]);

	const handleClick = () => {
		let hasMissing = false;
		const errors: string[] = [];

		computed.items.forEach((item: any, idx: number) => {
			const miss = missingRequiredFields(item);
			if (miss.length) {
				hasMissing = true;
				errors.push(`• المنتج ${idx + 1}: ${item.product?.name} (${miss.join("، ")})`);
			}
		});

		if (hasMissing) {
			const msg = `
الرجاء اختيار كل الحقول المطلوبة قبل المتابعة
المنتجات التي تحتاج إكمال البيانات:
${errors.join("\n")}
      `;

			Swal.fire({
				icon: "error",
				title: "الحقول غير مكتملة",
				html: msg.replace(/\n/g, "<br/>"),
				confirmButtonText: "حسنًا",
				customClass: {
					popup: "font-sans text-sm",
					confirmButton: "bg-pro text-white font-bold",
				},
			});
			return;
		}

		router.push("/payment");
	};

	return (
		<div className="container pb-8 !pt-5" dir="rtl">
			<div className="flex items-center gap-2 text-sm mb-2">
				<Link href="/" aria-label="go to home" className="text-pro-max font-bold">
					الرئيسيه
				</Link>
				<MdKeyboardArrowLeft />
				<h6 className="text-gray-600 font-bold">عربة التسوق</h6>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
				<div className="col-span-1 lg:col-span-2">
					<div className="flex flex-col my-4 bg-transparent overflow-hidden">
						{computed.items.map((item: any) => {
							const miss = missingRequiredFields(item);
							const hasVariants = productNeedsSelection(item.product);
							const hasTierQty = n(item._real?.tier_qty) > 0;

							return (
								<div key={item.cart_item_id} className="p-5 relative border rounded-2xl border-slate-200 bg-white shadow-sm mb-4">
									<div className="relative md:border-0 border-b border-slate-200 pb-4">
										<div className="md:flex justify-between items-start md:flex-row flex-col gap-3">
											<div className="flex gap-3 w-full md:w-fit">
												<div className="w-24 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
													<Link href={`/product/${item.product.id}`}>
														<Image
															src={item.product.image || "/images/not.jpg"}
															alt={item.product.name}
															width={96}
															height={80}
															className="w-full h-full object-cover"
														/>
													</Link>
												</div>

												<div className="flex flex-col justify-between">
													<div>
														<h3 className="font-extrabold text-[15px] text-slate-900">{item.product.name}</h3>

														{/* ✅ show effective quantity when tier chosen */}
														{hasTierQty && (
															<p className="text-xs font-extrabold text-slate-600 mt-1">
																كمية المقاس: {n(item._real?.tier_qty)} قطعة
															</p>
														)}

														<div className="mt-2 flex flex-wrap items-center gap-2">
															<span className="text-sm font-extrabold text-slate-900">
																{money(n(item._unit))} <span className="text-xs">ريال</span>
															</span>

															{item._real?.discount && n(item._real?.original_unit_after_options) > n(item._unit) && (
																<>
																	<span className="text-xs font-extrabold text-slate-500 line-through">
																		{money(n(item._real?.original_unit_after_options))} ريال
																	</span>
																	<span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
																		خصم
																	</span>
																</>
															)}

															<p className="text-sm text-emerald-700   font-extrabold">
																الإجمالي: {money(n(item._line))} ريال
															</p>

														</div>

													</div>
												</div>
											</div>

											{/* ✅ IMPORTANT: if tier qty chosen, disable +/- because tier controls qty */}
											<div className="flex max-md:mt-6 max-md:justify-end items-center gap-2">
												<div className={`flex items-center gap-3 border border-slate-200 rounded-2xl overflow-hidden ${hasTierQty ? "opacity-50 pointer-events-none" : ""}`}>
													<button
														onClick={() => {
															if (item.quantity >= 10) {
																toast.error("الحد الأقصى 10 قطع فقط لهذا المنتج", { icon: "معلومة", duration: 4000 });
															} else {
																updateQuantity(item.cart_item_id, item.quantity + 1);
															}
														}}
														className="w-10 h-9 text-slate-600 cursor-pointer border-slate-200 border-l transition flex items-center justify-center hover:bg-slate-50"
													>
														<FaPlus size={16} />
													</button>

													{/* ✅ SHOW effective quantity */}
													<span className="font-extrabold w-6 text-lg text-center bg-white text-slate-900">
														{item._effectiveQty}
													</span>

													<button
														onClick={() => {
															if (item.quantity <= 1) removeFromCart(item.cart_item_id);
															else updateQuantity(item.cart_item_id, item.quantity - 1);
														}}
														className="w-10 h-9 border-slate-200 border-r cursor-pointer transition flex items-center justify-center hover:bg-slate-50"
													>
														{item.quantity <= 1 ? <BsTrash3 className="text-rose-600" size={16} /> : <FaMinus className="text-slate-600" size={14} />}
													</button>
												</div>

												<button
													onClick={async () => {
														const result = await Swal.fire({
															title: "هل أنت متأكد؟",
															text: "سيتم حذف هذا المنتج من السلة نهائيًا!",
															icon: "warning",
															showCancelButton: true,
															confirmButtonColor: "#d33",
															cancelButtonColor: "#3085d6",
															confirmButtonText: "نعم، احذفه",
															cancelButtonText: "لا، ألغِ الأمر",
															reverseButtons: true,
															customClass: {
																popup: "animate__animated animate__fadeInDown",
																confirmButton: "font-bold",
																cancelButton: "font-bold",
															},
														});

														if (result.isConfirmed) await removeFromCart(item.cart_item_id);
													}}
													className="cursor-pointer md:relative"
													aria-label="remove"
												>
													<IoIosCloseCircle className="text-rose-500" size={40} />
												</button>
											</div>
										</div>
									</div>

									{hasVariants && miss.length > 0 && (
										<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
											<p className="font-extrabold text-amber-800">
												لازم تختار: <span className="text-amber-900">{miss.join("، ")}</span>
											</p>
											<p className="text-xs font-bold text-amber-700 mt-1">
												السعر بيتغير حسب الاختيارات — اختياراتك هنا هتنعكس فورًا على السعر.
											</p>
										</div>
									)}

									{hasVariants && (
										<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
											<StickerForm cartItemId={item.cart_item_id} productId={item.product.id} productData={item.product} />
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<div className="col-span-1">
					<div className="border border-slate-200 rounded-2xl p-6 mt-4 bg-white shadow-sm">
						<CoBon />

						<h4 className="text-md font-extrabold text-pro my-5">ملخص الطلب</h4>

						<TotalOrder
							response={{
								status: true,
								data: {
									items_count: cartCount,
									subtotal: String(computed.subtotal),
									total: String(computed.finalTotal),
									items: computed.items,
								},
							}}
						/>

						<Button
							variant="contained"
							onClick={handleClick}
							fullWidth
							sx={{
								mt: 3,
								py: 1.5,
								fontSize: "1.1rem",
								fontWeight: "bold",
								backgroundColor: "#14213d",
								"&:hover": { backgroundColor: "#0f1a31" },
								borderRadius: "14px",
								textTransform: "none",
							}}
							endIcon={<KeyboardBackspaceIcon />}
						>
							تابع عملية الشراء
						</Button>

						<p className="text-xs text-slate-500 text-center mt-3 font-bold">ملحوظة: السعر الإجمالي محسوب حسب اختياراتك الحالية.</p>
					</div>
				</div>
			</div>
		</div>
	);
}

const StickerForm = forwardRef(function StickerForm(
	{ cartItemId, productId, productData, onOptionsChange, showValidation = false }: StickerFormProps,
	ref
) {
	// ✅ ADD updateQuantity HERE so we can POST quantity after tier is chosen
	const { updateCartItem, fetchCartItemOptions, updateQuantity } = useCart();

	const [size, setSize] = useState("اختر");
	const [color, setColor] = useState("اختر");
	const [material, setMaterial] = useState("اختر");

	const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
	const [printingMethod, setPrintingMethod] = useState("اختر");

	// ✅ multi print locations
	const [printLocations, setPrintLocations] = useState<string[]>([]);

	// ✅ size tiers states
	const [sizeTierId, setSizeTierId] = useState<number | null>(null);
	const [sizeTierQty, setSizeTierQty] = useState<number | null>(null);
	const [sizeTierUnit, setSizeTierUnit] = useState<number | null>(null);
	const [sizeTierTotal, setSizeTierTotal] = useState<number | null>(null);

	const [apiData, setApiData] = useState<any>(null);
	const [formLoading, setFormLoading] = useState(true);

	const [saving, setSaving] = useState(false);
	const [showSaveButton, setShowSaveButton] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [savedSuccessfully, setSavedSuccessfully] = useState(false);

	const [apiError, setApiError] = useState<string | null>(null);

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

	const needSizeTier = useMemo(() => {
		return (apiData?.sizes?.length ?? 0) > 0 && size !== "اختر" && sizeTiers.length > 0;
	}, [apiData, size, sizeTiers]);

	const validateCurrentOptions = useCallback(() => {
		if (!apiData) return false;

		let isValid = true;

		if (apiData.sizes?.length > 0 && (!size || size === "اختر")) isValid = false;
		if (apiData.colors?.length > 0 && (!color || color === "اختر")) isValid = false;
		if (apiData.materials?.length > 0 && (!material || material === "اختر")) isValid = false;

		if (Array.isArray(apiData?.options) && apiData.options.length > 0) {
			requiredOptionGroups.forEach((g) => {
				const v = optionGroups?.[g];
				if (!v || v === "اختر") isValid = false;
			});
		}

		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0) {
			if (!printingMethod || printingMethod === "اختر") isValid = false;
		}

		if (Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0) {
			if (!Array.isArray(printLocations) || printLocations.length === 0) isValid = false;
		}

		if (needSizeTier && !sizeTierId) isValid = false;

		return isValid;
	}, [apiData, size, color, material, optionGroups, requiredOptionGroups, printingMethod, printLocations, needSizeTier, sizeTierId]);

	useImperativeHandle(ref, () => ({
		getOptions: () => ({
			size,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_locations: printLocations,
			size_tier_id: sizeTierId,
			size_tier_qty: sizeTierQty,
			size_tier_unit: sizeTierUnit,
			size_tier_total: sizeTierTotal,
			isValid: validateCurrentOptions(),
		}),
		validate: () => validateCurrentOptions(),
	}));

	useEffect(() => {
		if (!onOptionsChange) return;
		onOptionsChange({
			size,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_locations: printLocations,
			size_tier_id: sizeTierId,
			size_tier_qty: sizeTierQty,
			size_tier_unit: sizeTierUnit,
			size_tier_total: sizeTierTotal,
			isValid: validateCurrentOptions(),
		});
	}, [
		size,
		color,
		material,
		optionGroups,
		printingMethod,
		printLocations,
		sizeTierId,
		sizeTierQty,
		sizeTierUnit,
		sizeTierTotal,
		validateCurrentOptions,
		onOptionsChange,
	]);

	// ✅ NO FETCH: load options from productData (cart item)
	useEffect(() => {
		setApiError(null);
		setFormLoading(true);

		try {
			if (!productData) throw new Error("لا توجد بيانات للمنتج");

			setApiData(productData);

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
		} catch (err: any) {
			setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
			setApiData(null);
		} finally {
			setFormLoading(false);
		}
	}, [productData]);

	const extractValueFromOptions = useCallback((options: any[], optionName: string) => {
		if (!options || !Array.isArray(options)) return null;
		const option = options.find((opt: any) => opt.option_name === optionName);
		return option ? option.option_value : null;
	}, []);

	const loadSavedOptions = useCallback(async () => {
		if (!cartItemId) return;
		setFormLoading(true);

		try {
			const savedOptions = await fetchCartItemOptions(cartItemId);

			if (savedOptions) {
				const sizeFromOptions = extractValueFromOptions(savedOptions.selected_options, "المقاس");
				const tierQtyFromOptions = extractValueFromOptions(savedOptions.selected_options, "كمية المقاس");
				const tierTotalFromOptions = extractValueFromOptions(savedOptions.selected_options, "سعر المقاس الإجمالي");

				const colorFromOptions = extractValueFromOptions(savedOptions.selected_options, "اللون");
				const materialFromOptions = extractValueFromOptions(savedOptions.selected_options, "الخامة");
				const printingFromOptions = extractValueFromOptions(savedOptions.selected_options, "طريقة الطباعة");

				const locationsFromOptions: string[] =
					Array.isArray(savedOptions.selected_options)
						? savedOptions.selected_options
							.filter((o: any) => String(o?.option_name || "").includes("مكان الطباعة"))
							.map((o: any) => String(o?.option_value || "").trim())
							.filter((v: any) => !!v && v !== "اختر")
						: [];

				setSize(sizeFromOptions || savedOptions.size || "اختر");
				setColor(colorFromOptions || (savedOptions.color?.name || savedOptions.color) || "اختر");
				setMaterial(materialFromOptions || savedOptions.material || "اختر");
				setPrintingMethod(printingFromOptions || "اختر");
				setPrintLocations(locationsFromOptions);

				setSizeTierQty(tierQtyFromOptions ? n(tierQtyFromOptions) : null);
				setSizeTierTotal(tierTotalFromOptions ? n(tierTotalFromOptions) : null);

				const out: Record<string, string> = {};
				Object.keys(groupedOptions).forEach((g) => (out[g] = "اختر"));
				if (savedOptions.selected_options && Array.isArray(savedOptions.selected_options)) {
					savedOptions.selected_options.forEach((opt: any) => {
						const name = String(opt.option_name || "").trim();
						const value = String(opt.option_value || "").trim();
						if (!name || !value) return;

						if (["المقاس", "كمية المقاس", "سعر المقاس الإجمالي", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة"].includes(name))
							return;
						if (Object.prototype.hasOwnProperty.call(out, name)) out[name] = value;
					});
				}
				setOptionGroups(out);

				setHasUnsavedChanges(false);
				setShowSaveButton(false);
			}
		} catch {
			// ignore
		} finally {
			setFormLoading(false);
		}
	}, [cartItemId, fetchCartItemOptions, extractValueFromOptions, groupedOptions]);

	useEffect(() => {
		if (!cartItemId || !apiData) return;
		loadSavedOptions();
	}, [cartItemId, apiData, loadSavedOptions]);

	// ✅ restore tier meta from qty (and handle total_price=0 by computing qty*unit)
	useEffect(() => {
		if (!needSizeTier) {
			setSizeTierId(null);
			setSizeTierQty(null);
			setSizeTierUnit(null);
			setSizeTierTotal(null);
			return;
		}

		if (sizeTierQty) {
			const found = sizeTiers.find((t: any) => n(t.quantity) === n(sizeTierQty));
			if (found) {
				const backendTotal = n(found.total_price);
				const computedTotal = n(found.quantity) * n(found.price_per_unit);

				setSizeTierId(n(found.id));
				setSizeTierUnit(n(found.price_per_unit));
				setSizeTierTotal(backendTotal > 0 ? backendTotal : computedTotal);
			}
		}
	}, [needSizeTier, sizeTiers, sizeTierQty]);

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

		setHasUnsavedChanges(true);
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const handleOptionChange = (setter: (v: string) => void, value: string) => {
		setter(value);
		setShowSaveButton(true);
		setHasUnsavedChanges(true);
		setSavedSuccessfully(false);
	};

	const handleSizeChange = (value: string) => {
		handleOptionChange(setSize, value);
		setSizeTierId(null);
		setSizeTierQty(null);
		setSizeTierUnit(null);
		setSizeTierTotal(null);
	};

	// ✅ compute total for tier even if total_price missing
	const handleTierChange = (tierIdStr: string) => {
		if (!tierIdStr || tierIdStr === "اختر") {
			setSizeTierId(null);
			setSizeTierQty(null);
			setSizeTierUnit(null);
			setSizeTierTotal(null);
			return;
		}

		const tierId = Number(tierIdStr);
		const tier = sizeTiers.find((t: any) => n(t?.id) === tierId) || null;

		if (!tier) {
			setSizeTierId(null);
			setSizeTierQty(null);
			setSizeTierUnit(null);
			setSizeTierTotal(null);
			return;
		}

		const qty = n(tier.quantity);
		const unit = n(tier.price_per_unit);
		const backendTotal = n(tier.total_price);
		const computedTotal = qty > 0 && unit > 0 ? qty * unit : 0;
		const finalTotal = backendTotal > 0 ? backendTotal : computedTotal;

		setSizeTierId(n(tier.id));
		setSizeTierQty(qty > 0 ? qty : null);
		setSizeTierUnit(unit > 0 ? unit : null);
		setSizeTierTotal(finalTotal > 0 ? finalTotal : null);

		setHasUnsavedChanges(true);
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const handleGroupChange = (groupName: string, value: string) => {
		setOptionGroups((prev) => {
			const next = { ...prev, [groupName]: value };
			setHasUnsavedChanges(true);
			setShowSaveButton(true);
			setSavedSuccessfully(false);
			return next;
		});
	};

	const handlePrintLocationsChange = (value: string[]) => {
		setPrintLocations(value);
		setHasUnsavedChanges(true);
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const saveAllOptions = async () => {
		if (!cartItemId || !apiData) return;

		setSaving(true);
		setSavedSuccessfully(false);

		const selected_options: any[] = [];

		const sizeObj = apiData?.sizes?.find((s: any) => String(s.name).trim() === String(size).trim());
		if (apiData.sizes?.length > 0 && size !== "اختر") {
			selected_options.push({ option_name: "المقاس", option_value: size, additional_price: 0 });
		}

		if (needSizeTier && sizeTierQty) {
			selected_options.push({ option_name: "كمية المقاس", option_value: String(sizeTierQty), additional_price: 0 });
		}
		if (needSizeTier && sizeTierTotal) {
			selected_options.push({ option_name: "سعر المقاس الإجمالي", option_value: String(sizeTierTotal), additional_price: 0 });
		}

		const colorObj = apiData?.colors?.find((c: any) => String(c.name).trim() === String(color).trim());
		if (apiData.colors?.length > 0 && color !== "اختر") {
			selected_options.push({ option_name: "اللون", option_value: color, additional_price: n(colorObj?.additional_price) });
		}

		const materialObj = apiData?.materials?.find((m: any) => String(m.name).trim() === String(material).trim());
		if (apiData.materials?.length > 0 && material !== "اختر") {
			selected_options.push({ option_name: "الخامة", option_value: material, additional_price: n(materialObj?.additional_price) });
		}

		Object.entries(optionGroups || {}).forEach(([group, value]) => {
			if (!value || value === "اختر") return;

			const row = (Array.isArray(apiData?.options) ? apiData.options : []).find(
				(o: any) => String(o.option_name).trim() === String(group).trim() && String(o.option_value).trim() === String(value).trim()
			);

			selected_options.push({ option_name: group, option_value: value, additional_price: n(row?.additional_price) });
		});

		const methodObj = apiData?.printing_methods?.find((p: any) => String(p.name).trim() === String(printingMethod).trim());
		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0 && printingMethod !== "اختر") {
			selected_options.push({
				option_name: "طريقة الطباعة",
				option_value: printingMethod,
				additional_price: n(methodObj?.pivot_price ?? methodObj?.base_price),
			});
		}

		const locList = Array.isArray(apiData?.print_locations) ? apiData.print_locations : [];
		const selectedLocObjs = (printLocations || [])
			.map((name) => locList.find((l: any) => String(l.name).trim() === String(name).trim()))
			.filter(Boolean);

		for (const locObj of selectedLocObjs as any[]) {
			selected_options.push({
				option_name: "مكان الطباعة",
				option_value: String(locObj.name),
				additional_price: n(locObj?.pivot_price ?? locObj?.additional_price),
			});
		}

		let print_location_ids: number[] = [];
		let embroider_location_ids: number[] = [];

		for (const locObj of selectedLocObjs as any[]) {
			const id = locObj?.id;
			if (typeof id !== "number") continue;

			const t = String(locObj?.type || "").toLowerCase();
			if (t === "embroider" || t === "embroidery") embroider_location_ids.push(id);
			else print_location_ids.push(id);
		}

		// ✅ payload
		const payload: any = {
			selected_options,
			size_id: sizeObj?.id ?? null,
			color_id: colorObj?.id ?? null,
			material_id: materialObj?.id ?? null,
			printing_method_id: methodObj?.id ?? null,
			print_locations: print_location_ids,
			embroider_locations: embroider_location_ids,
			quantity: needSizeTier && sizeTierQty ? Number(sizeTierQty) : undefined, // try to update here too
		};

		try {
			const success = await updateCartItem(cartItemId, payload);

			// ✅ FORCE POST quantity update if updateCartItem doesn't change it
			const qty = needSizeTier && sizeTierQty ? Number(sizeTierQty) : null;
			if (success && qty && typeof updateQuantity === "function") {
				try {
					await updateQuantity(cartItemId, qty);
				} catch {
					// ignore
				}
			}

			if (success) {
				setSavedSuccessfully(true);
				setHasUnsavedChanges(false);
				setShowSaveButton(false);
				setTimeout(() => setSavedSuccessfully(false), 2500);
			}
		} finally {
			setSaving(false);
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

	const needSize = apiData?.sizes?.length > 0;
	const needColor = apiData?.colors?.length > 0;
	const needMaterial = apiData?.materials?.length > 0;

	const needPrintingMethod = Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0;
	const needPrintLocation = Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0;

	return (
		<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="pt-4 mt-4">
			{cartItemId && showSaveButton && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Warning className="text-yellow-600 text-sm" />
							<p className="text-sm text-yellow-800 font-bold">لديك تغييرات غير محفوظة</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outlined"
								size="small"
								onClick={resetAllOptions}
								startIcon={<Refresh />}
								className="flex items-center gap-2"
								sx={{ borderRadius: "14px", borderColor: "#e2e8f0", color: "#0f172a", fontWeight: 900 }}
							>
								إعادة تعيين
							</Button>

							<Button
								variant="contained"
								size="small"
								onClick={saveAllOptions}
								disabled={saving}
								startIcon={saving ? <CircularProgress size={16} /> : <Save />}
								className="flex items-center gap-2"
								sx={{ borderRadius: "14px", backgroundColor: "#f59e0b", fontWeight: 900 }}
							>
								{saving ? "جاري الحفظ..." : "حفظ"}
							</Button>
						</div>
					</div>
				</motion.div>
			)}

			{cartItemId && savedSuccessfully && (
				<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
					<Alert severity="success" className="rounded-2xl" icon={<CheckCircle />}>
						تم حفظ التغييرات بنجاح
					</Alert>
				</motion.div>
			)}

			<div className="space-y-4">
				{needSize && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSize && size === "اختر"}>
							<InputLabel>المقاس</InputLabel>
							<Select value={size} onChange={(e) => handleSizeChange(e.target.value as string)} label="المقاس" className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.sizes.map((s: any) => (
									<MenuItem key={s.id} value={s.name}>
										{s.name}
									</MenuItem>
								))}
							</Select>
							{showValidation && needSize && size === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار المقاس</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needSizeTier && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && !sizeTierId}>
							<InputLabel>الكمية</InputLabel>
							<Select value={sizeTierId ? String(sizeTierId) : "اختر"} onChange={(e) => handleTierChange(e.target.value as string)} label="الكمية" className="bg-white">
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>

								{sizeTiers.map((t: any) => {
									const qty = n(t.quantity);
									const unit = n(t.price_per_unit);
									const backendTotal = n(t.total_price);
									const computedTotal = qty > 0 && unit > 0 ? qty * unit : 0;
									const showTotal = backendTotal > 0 ? backendTotal : computedTotal;

									return (
										<MenuItem key={t.id} value={String(t.id)}>
											<div className="flex items-center justify-between gap-3 w-full">
												<span>{qty} قطعة</span>
												<span className="text-xs font-black text-slate-700">{money(showTotal)} ر.س</span>
											</div>
										</MenuItem>
									);
								})}
							</Select>

							{showValidation && !sizeTierId && <FormHelperText className="text-red-500 text-xs">يجب اختيار الكمية</FormHelperText>}

							{!!sizeTierId && (
								<FormHelperText className="text-slate-600 text-xs">
									سعر الوحدة: {money(n(sizeTierUnit))} — الإجمالي: {money(n(sizeTierTotal))}
								</FormHelperText>
							)}
						</FormControl>
					</Box>
				)}

				{needColor && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needColor && color === "اختر"}>
							<InputLabel>اللون</InputLabel>
							<Select value={color} onChange={(e) => handleOptionChange(setColor, e.target.value as string)} label="اللون" className="bg-white">
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
							{showValidation && needColor && color === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار اللون</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{needMaterial && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needMaterial && material === "اختر"}>
							<InputLabel>الخامة</InputLabel>
							<Select value={material} onChange={(e) => handleOptionChange(setMaterial, e.target.value as string)} label="الخامة" className="bg-white">
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
							{showValidation && needMaterial && material === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار الخامة</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{Object.keys(groupedOptions).map((groupName) => {
					const items = groupedOptions[groupName] || [];
					const required = items.some((x: any) => Boolean(x?.is_required));
					const currentValue = optionGroups?.[groupName] || "اختر";
					const fieldError = showValidation && required && currentValue === "اختر";

					return (
						<Box key={groupName}>
							<FormControl fullWidth size="small" required={required} error={fieldError}>
								<InputLabel>{groupName}</InputLabel>
								<Select value={currentValue} onChange={(e) => handleGroupChange(groupName, e.target.value as string)} label={groupName} className="bg-white">
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

								{fieldError && <FormHelperText className="text-red-500 text-xs">يجب اختيار {groupName}</FormHelperText>}
							</FormControl>
						</Box>
					);
				})}

				{needPrintingMethod && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
							<InputLabel>طريقة الطباعة</InputLabel>
							<Select value={printingMethod} onChange={(e) => handleOptionChange(setPrintingMethod, e.target.value as string)} label="طريقة الطباعة" className="bg-white">
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
						<FormControl fullWidth size="small" required error={showValidation && (!printLocations || printLocations.length === 0)}>
							<InputLabel>مكان الطباعة</InputLabel>
							<Select
								multiple
								value={printLocations}
								onChange={(e) => handlePrintLocationsChange(e.target.value as string[])}
								label="مكان الطباعة"
								className="bg-white"
								renderValue={(selected) => (Array.isArray(selected) ? selected.join("، ") : "")}
							>
								{apiData.print_locations.map((p: any) => (
									<MenuItem key={p.id} value={p.name}>
										<div className="flex items-center justify-between gap-3 w-full">
											<span>{p.name}</span>
											<span className="text-xs font-black text-slate-500">{p.type}</span>
										</div>
									</MenuItem>
								))}
							</Select>

							{showValidation && (!printLocations || printLocations.length === 0) && (
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

function TotalOrder({ response }: { response?: any }) {
	const { cart, cartCount, subtotal, total } = useCart();

	const [cartData, setCartData] = useState({
		items_count: cartCount || 0,
		subtotal: subtotal || 0,
		total: total || 0,
		items: cart || [],
	});

	useEffect(() => {
		if (response && response.status) {
			setCartData({
				items_count: response.data.items_count,
				subtotal: parseFloat(response.data.subtotal),
				total: parseFloat(response.data.total),
				items: response.data.items,
			});
		} else {
			setCartData({
				items_count: cartCount,
				subtotal,
				total,
				items: cart,
			});
		}
	}, [response, cart, cartCount, subtotal, total]);

	const formattedSubtotal = cartData.subtotal.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	const shippingFree = true;
	const shippingFee = shippingFree ? 0 : 48;

	const grandTotal = (cartData.total + shippingFee).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return (
		<div className="my-4 gap-2 flex flex-col">
			<div className="flex text-sm items-center justify-between text-black">
				<p className="font-semibold">المجموع ({cartData.items?.length} عناصر)</p>
				<p>
					{formattedSubtotal}
					<span className="text-sm ms-1">ريال</span>
				</p>
			</div>

			<div className="flex items-center justify-between">
				<p className="text-sm">إجمالي رسوم الشحن</p>
				{shippingFree ? (
					<p className="font-semibold text-green-600">مجانا</p>
				) : (
					<p className="text-md">
						{shippingFee}
						<span className="text-sm ms-1">ريال</span>
					</p>
				)}
			</div>

			<div className="flex items-center justify-between pb-3 pt-2">
				<div className="flex gap-1 items-center">
					<p className="text-md text-pro font-semibold">الإجمالي :</p>
					<p className="text-[12px] font-semibold text-gray-600">(يشمل ضريبة القيمة المضافة)</p>
				</div>

				<p className="text-[15px] text-pro font-bold">
					{grandTotal}
					<span> ريال</span>
				</p>
			</div>
		</div>
	);
}
