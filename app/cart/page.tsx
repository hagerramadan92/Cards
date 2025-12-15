"use client";

import Link from "next/link";
import Image from "next/image";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { BsTrash3 } from "react-icons/bs";
import { MdKeyboardArrowLeft } from "react-icons/md";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { IoIosCloseCircle } from "react-icons/io";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import { useCart } from "@/src/context/CartContext";
import CoBon from "@/components/cobon";
import TotalOrder from "@/components/TotalOrder";
import StickerForm from "@/components/StickerForm";

import Button from "@mui/material/Button";
import CartSkeleton from "@/components/skeletons/CartSkeleton";

type SelectedOpt = { option_name: string; option_value: string };

function n(v: any) {
	const x = typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number(v ?? 0);
	return Number.isFinite(x) ? x : 0;
}

function money(v: number) {
	return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function safeParseSelectedOptions(raw: any): SelectedOpt[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Compute unit price from product base (final_price if discount else price)
 * + additional_price from:
 * - selected product.options (option_name + option_value)
 * - selected printing method (pivot_price/base_price)
 * - selected print/embroider locations (pivot_price/additional_price)
 * - colors/materials (additional_price)
 * - size tiers (choose best tier <= qty)
 *
 * If API cart item has price_per_unit != 0 use it as truth.
 */
function computePricing(item: any) {
	const p = item.product || {};
	const qty = n(item.quantity || 1);

	const apiUnit = n(item.price_per_unit);
	const apiLine = n(item.line_total);

	// Base price: prefer discounted final_price if product.has_discount
	const base =
		p?.has_discount ? n(p?.final_price) : n(p?.price);

	// if product has sizes tiers, choose price_per_unit based on quantity
	let sizeTierUnit: number | null = null;
	const sizes = Array.isArray(p?.sizes) ? p.sizes : [];
	if (sizes.length) {
		// selected size might be in selected_options ("المقاس")
		const selected = safeParseSelectedOptions(item.selected_options).find(
			(o) => o.option_name?.includes("المقاس")
		)?.option_value;

		const selectedSize = selected
			? sizes.find((s: any) => String(s.name).trim() === String(selected).trim())
			: null;

		const sizeObj = selectedSize || null;

		if (sizeObj?.tiers?.length) {
			// pick best tier for qty (max quantity <= qty)
			const tiers = [...sizeObj.tiers]
				.map((t: any) => ({ q: n(t.quantity), unit: n(t.price_per_unit) }))
				.filter((t: any) => t.q > 0 && t.unit > 0)
				.sort((a: any, b: any) => a.q - b.q);

			const best = tiers.filter((t: any) => t.q <= qty).at(-1);
			if (best?.unit) sizeTierUnit = best.unit;
		}
	}

	const selectedOptions = safeParseSelectedOptions(item.selected_options);

	// additional price from product.options
	const productOptions = Array.isArray(p?.options) ? p.options : [];
	let addFromOptions = 0;
	for (const sel of selectedOptions) {
		const match = productOptions.find(
			(x: any) =>
				String(x.option_name).trim() === String(sel.option_name).trim() &&
				String(x.option_value).trim() === String(sel.option_value).trim()
		);
		if (match) addFromOptions += n(match.additional_price);
	}

	// colors additional_price
	const colors = Array.isArray(p?.colors) ? p.colors : [];
	const selectedColor = selectedOptions.find((o) => o.option_name?.includes("اللون"))?.option_value;
	if (selectedColor) {
		const c = colors.find((x: any) => String(x.name).trim() === String(selectedColor).trim());
		if (c) addFromOptions += n(c.additional_price);
	}

	// materials additional_price
	const materials = Array.isArray(p?.materials) ? p.materials : [];
	const selectedMat = selectedOptions.find((o) => o.option_name?.includes("الخامة"))?.option_value;
	if (selectedMat) {
		const m = materials.find((x: any) => String(x.name).trim() === String(selectedMat).trim());
		if (m) addFromOptions += n(m.additional_price);
	}

	// printing method price
	const printingMethods = Array.isArray(p?.printing_methods) ? p.printing_methods : [];
	const selectedPrintMethod = selectedOptions.find((o) => o.option_name?.includes("طريقة الطباعة"))?.option_value;
	if (selectedPrintMethod) {
		const pm = printingMethods.find((x: any) => String(x.name).trim() === String(selectedPrintMethod).trim());
		if (pm) addFromOptions += n(pm.pivot_price ?? pm.base_price);
	}

	// print locations price (print + embroider)
	const printLocations = Array.isArray(p?.print_locations) ? p.print_locations : [];
	const selectedLocation = selectedOptions.find((o) => o.option_name?.includes("مكان الطباعة"))?.option_value;
	if (selectedLocation) {
		const loc = printLocations.find((x: any) => String(x.name).trim() === String(selectedLocation).trim());
		if (loc) addFromOptions += n(loc.pivot_price ?? loc.additional_price);
	}

	// Decide final unit
	const computedUnit = (sizeTierUnit ?? base) + addFromOptions;
	const computedLine = computedUnit * qty;

	const unit = apiUnit > 0 ? apiUnit : computedUnit;
	const line = apiLine > 0 ? apiLine : computedLine;

	const showRealProductPrice = {
		base: sizeTierUnit ?? base,
		final: computedUnit,
		discount: !!p?.has_discount,
		original: n(p?.price),
		finalFromApi: n(p?.final_price),
	};

	return { unit, line, showRealProductPrice };
}

function productNeedsSelection(p: any) {
	const has =
		(p?.sizes?.length ?? 0) > 0 ||
		(p?.colors?.length ?? 0) > 0 ||
		(p?.materials?.length ?? 0) > 0 ||
		(p?.options?.length ?? 0) > 0 ||
		(p?.printing_methods?.length ?? 0) > 0 ||
		(p?.print_locations?.length ?? 0) > 0;

	return !!has;
}

function missingRequiredFields(item: any) {
	const p = item.product || {};
	const selected = safeParseSelectedOptions(item.selected_options);

	const hasSize = (p?.sizes?.length ?? 0) > 0;
	const hasColors = (p?.colors?.length ?? 0) > 0;
	const hasMaterials = (p?.materials?.length ?? 0) > 0;

	const requiredOpts = (Array.isArray(p?.options) ? p.options : []).filter((o: any) => o.is_required);

	const miss: any = [];

	if (hasSize && !selected.some((o) => o.option_name?.includes("المقاس"))) miss.push("المقاس");
	if (hasColors && !selected.some((o) => o.option_name?.includes("اللون"))) miss.push("اللون");
	if (hasMaterials && !selected.some((o) => o.option_name?.includes("الخامة"))) miss.push("الخامة");

	// required product.options (by option_name group)
	const requiredNames = Array.from(new Set(requiredOpts.map((o: any) => String(o.option_name).trim())));
	for (const name of requiredNames) {
		const ok = selected.some((s) => String(s.option_name).trim() === name && String(s.option_value).trim());
		if (!ok) miss.push(name);
	}

	return miss;
}

export default function CartPage() {
	const router = useRouter();
	const { cart, cartCount, total, removeFromCart, updateQuantity, loading } = useCart();

	// pretty skeleton instead of spinner
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

	// compute totals locally to reflect variants instantly (when StickerForm updates cart context)
	const computed = useMemo(() => {
		const items = cart.map((it: any) => {
			const pr = computePricing(it);
			return { ...it, _unit: pr.unit, _line: pr.line, _real: pr.showRealProductPrice };
		});

		const subtotal = items.reduce((acc: number, it: any) => acc + n(it._line), 0);

		// keep your existing "total" from context if you want, but computed is safer when API returns 0
		const finalTotal = subtotal;

		return { items, subtotal, finalTotal };
	}, [cart]);

	const handleClick = () => {
		// validate required fields before payment
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
		<div className="container pb-8 pt-5" dir="rtl">
			<div className="flex items-center gap-2 text-sm mb-2">
				<Link href="/" aria-label="go to home" className="text-pro-max font-bold">
					الرئيسيه
				</Link>
				<MdKeyboardArrowLeft />
				<h6 className="text-gray-600 font-bold">عربة التسوق</h6>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
				{/* items */}
				<div className="col-span-1 lg:col-span-2">
					<div className="flex flex-col my-4 bg-transparent overflow-hidden">
						{computed.items.map((item: any) => {
							const miss = missingRequiredFields(item);
							const hasVariants = productNeedsSelection(item.product);

							return (
								<div
									key={item.cart_item_id}
									className="p-5 relative border rounded-2xl border-slate-200 bg-white shadow-sm mb-4"
								>
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
														<h3 className="font-extrabold text-[15px] text-slate-900">
															{item.product.name}
														</h3>

														{/* REAL PRICE UI */}
														<div className="mt-2 flex flex-wrap items-center gap-2">
															{item._real?.discount ? (
																<>
																	<span className="text-sm font-extrabold text-slate-900">
																		{money(n(item._real?.final))} <span className="text-xs">جنيه</span>
																	</span>
																	<span className="text-xs font-extrabold text-slate-500 line-through">
																		{money(n(item._real?.original))} جنيه
																	</span>
																	<span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
																		خصم
																	</span>
																</>
															) : (
																<span className="text-sm font-extrabold text-slate-900">
																	{money(n(item._unit))} <span className="text-xs">جنيه</span>
																</span>
															)}

															<span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
																إجمالي القطعة بعد الخيارات
															</span>
														</div>

														<p className="text-sm text-emerald-700 mt-2 font-extrabold">
															الإجمالي: {money(n(item._line))} جنيه
														</p>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2" >

												{/* qty controller */}
												<div className="flex items-center gap-3 border border-slate-200 rounded-2xl overflow-hidden">
													<button
														onClick={() => {
															if (item.quantity >= 10) {
																toast.error("الحد الأقصى 10 قطع فقط لهذا المنتج", {
																	icon: "معلومة",
																	duration: 4000,
																});
															} else {
																updateQuantity(item.cart_item_id, item.quantity + 1);
															}
														}}
														className="w-10 h-9 text-slate-600 cursor-pointer border-slate-200 border-l transition flex items-center justify-center hover:bg-slate-50"
													>
														<FaPlus size={16} />
													</button>

													<span className="font-extrabold w-6 text-lg text-center bg-white text-slate-900">
														{item.quantity}
													</span>

													<button
														onClick={() => {
															if (item.quantity <= 1) {
																removeFromCart(item.cart_item_id);
															} else {
																updateQuantity(item.cart_item_id, item.quantity - 1);
															}
														}}
														className="w-10 h-9 border-slate-200 border-r cursor-pointer transition flex items-center justify-center hover:bg-slate-50"
													>
														{item.quantity <= 1 ? (
															<BsTrash3 className="text-rose-600" size={16} />
														) : (
															<FaMinus className="text-slate-600" size={14} />
														)}
													</button>
												</div>

												{/* remove */}
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

														if (result.isConfirmed) {
															await removeFromCart(item.cart_item_id);
														}
													}}
													className="  cursor-pointer md:relative"
													aria-label="remove"
												>
													<IoIosCloseCircle className="text-rose-500" size={40} />
												</button>
											</div>
										</div>
									</div>

									{/* REQUIRED warning (if has variants and not selected yet) */}
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

									{/* StickerForm unchanged */}
									{hasVariants && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<StickerForm
											cartItemId={item.cart_item_id}
											productId={item.product.id}
											// showValidation
											// productData={item.product}
											// cartItemData={item}
										/>
									</div>}
								</div>
							);
						})}
					</div>
				</div>

				{/* summary */}
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

						<p className="text-xs text-slate-500 text-center mt-3 font-bold">
							ملحوظة: السعر الإجمالي محسوب حسب اختياراتك الحالية.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
