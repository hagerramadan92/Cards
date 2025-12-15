"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
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
} from "@mui/material";
import { motion } from "framer-motion";
import { useCart } from "@/src/context/CartContext";
import { Save, CheckCircle, Warning, Info, Refresh } from "@mui/icons-material";
import { StickerFormSkeleton } from "./skeletons/HomeSkeletons";

interface StickerFormProps {
	cartItemId?: number;
	productId: number;
	onOptionsChange?: (options: any) => void;
	showValidation?: boolean;
}

const StickerForm = forwardRef(function StickerForm(
	{ cartItemId, productId, onOptionsChange, showValidation = false }: StickerFormProps,
	ref
) {
	const { updateCartItem, fetchCartItemOptions } = useCart();

	const [size, setSize] = useState("اختر");
	const [color, setColor] = useState("اختر");
	const [material, setMaterial] = useState("اختر");

	// ✅ new
	const [optionGroups, setOptionGroups] = useState<Record<string, string>>({});
	const [printingMethod, setPrintingMethod] = useState("اختر");
	const [printLocation, setPrintLocation] = useState("اختر");

	const [apiData, setApiData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [formLoading, setFormLoading] = useState(true);

	const [saving, setSaving] = useState(false);
	const [showSaveButton, setShowSaveButton] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [savedSuccessfully, setSavedSuccessfully] = useState(false);

	const [apiError, setApiError] = useState<string | null>(null);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

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

	const validateCurrentOptions = useCallback(() => {
		if (!apiData) return false;

		let isValid = true;

		if (apiData.sizes?.length > 0 && (!size || size === "اختر")) isValid = false;
		if (apiData.colors?.length > 0 && (!color || color === "اختر")) isValid = false;
		if (apiData.materials?.length > 0 && (!material || material === "اختر")) isValid = false;

		// ✅ required option groups
		if (Array.isArray(apiData?.options) && apiData.options.length > 0) {
			requiredOptionGroups.forEach((g) => {
				const v = optionGroups?.[g];
				if (!v || v === "اختر") isValid = false;
			});
		}

		// ✅ printing required if exists
		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0) {
			if (!printingMethod || printingMethod === "اختر") isValid = false;
		}
		if (Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0) {
			if (!printLocation || printLocation === "اختر") isValid = false;
		}

		return isValid;
	}, [apiData, size, color, material, optionGroups, requiredOptionGroups, printingMethod, printLocation]);

	useImperativeHandle(ref, () => ({
		getOptions: () => ({
			size,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_location: printLocation,
			isValid: validateCurrentOptions(),
		}),
		validate: () => validateCurrentOptions(),
	}));

	// emit changes to parent
	useEffect(() => {
		if (!onOptionsChange) return;
		onOptionsChange({
			size,
			color,
			material,
			optionGroups,
			printing_method: printingMethod,
			print_location: printLocation,
			isValid: validateCurrentOptions(),
		});
	}, [size, color, material, optionGroups, printingMethod, printLocation, validateCurrentOptions, onOptionsChange]);

	// fetch options
	useEffect(() => {
		const fetchData = async () => {
			setApiError(null);
			setLoading(true);
			setFormLoading(true);

			try {
				const res = await fetch(`${baseUrl}/products/${productId}`, { cache: "no-store" });
				if (!res.ok) throw new Error("فشل تحميل خيارات المنتج");

				const data = await res.json();
				if (!data?.data) throw new Error("لا توجد بيانات للمنتج");

				setApiData(data.data);

				// ✅ init optionGroups with "اختر"
				if (Array.isArray(data.data?.options)) {
					const list = data.data.options;
					const out: Record<string, string> = {};
					list.forEach((o: any) => {
						const k = String(o.option_name || "").trim();
						if (!k) return;
						if (!out[k]) out[k] = "اختر";
					});
					setOptionGroups(out);
				} else {
					setOptionGroups({});
				}

				// ✅ init printing
				if (Array.isArray(data.data?.printing_methods) && data.data.printing_methods.length > 0) {
					setPrintingMethod("اختر");
				} else {
					setPrintingMethod("اختر");
				}

				if (Array.isArray(data.data?.print_locations) && data.data.print_locations.length > 0) {
					setPrintLocation("اختر");
				} else {
					setPrintLocation("اختر");
				}
			} catch (err: any) {
				setApiError(err?.message || "حدث خطأ أثناء تحميل الخيارات");
				setApiData(null);
			} finally {
				setLoading(false);
				setFormLoading(false);
			}
		};

		fetchData();
	}, [productId, baseUrl]);

	// load saved options for cartItemId
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
				const colorFromOptions = extractValueFromOptions(savedOptions.selected_options, "اللون");
				const materialFromOptions = extractValueFromOptions(savedOptions.selected_options, "الخامة");
				const printingFromOptions = extractValueFromOptions(savedOptions.selected_options, "طريقة الطباعة");
				const locationFromOptions = extractValueFromOptions(savedOptions.selected_options, "مكان الطباعة");

				setSize(sizeFromOptions || savedOptions.size || "اختر");
				setColor(colorFromOptions || (savedOptions.color?.name || savedOptions.color) || "اختر");
				setMaterial(materialFromOptions || savedOptions.material || "اختر");

				setPrintingMethod(printingFromOptions || "اختر");
				setPrintLocation(locationFromOptions || "اختر");

				// ✅ restore optionGroups
				const out: Record<string, string> = {};
				Object.keys(groupedOptions).forEach((g) => (out[g] = "اختر"));
				if (savedOptions.selected_options && Array.isArray(savedOptions.selected_options)) {
					savedOptions.selected_options.forEach((opt: any) => {
						const name = String(opt.option_name || "").trim();
						const value = String(opt.option_value || "").trim();
						if (!name || !value) return;

						// skip core names handled above
						if (["المقاس", "اللون", "الخامة", "طريقة الطباعة", "مكان الطباعة"].includes(name)) return;

						// if it's one of option groups, set it
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

	// save options for cart item
	const saveAllOptions = async () => {
		if (!cartItemId || !apiData) return;

		setSaving(true);
		setSavedSuccessfully(false);

		const selected_options: any[] = [];

		if (apiData.sizes?.length > 0 && size !== "اختر") selected_options.push({ option_name: "المقاس", option_value: size });
		if (apiData.colors?.length > 0 && color !== "اختر") selected_options.push({ option_name: "اللون", option_value: color });
		if (apiData.materials?.length > 0 && material !== "اختر") selected_options.push({ option_name: "الخامة", option_value: material });

		Object.entries(optionGroups || {}).forEach(([group, value]) => {
			if (value && value !== "اختر") selected_options.push({ option_name: group, option_value: value });
		});

		if (Array.isArray(apiData?.printing_methods) && apiData.printing_methods.length > 0 && printingMethod !== "اختر") {
			selected_options.push({ option_name: "طريقة الطباعة", option_value: printingMethod });
		}
		if (Array.isArray(apiData?.print_locations) && apiData.print_locations.length > 0 && printLocation !== "اختر") {
			selected_options.push({ option_name: "مكان الطباعة", option_value: printLocation });
		}

		try {
			const success = await updateCartItem(cartItemId, { selected_options });
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

	const resetAllOptions = () => {
		setSize("اختر");
		setColor("اختر");
		setMaterial("اختر");

		const resetGroups: Record<string, string> = {};
		Object.keys(groupedOptions).forEach((g) => (resetGroups[g] = "اختر"));
		setOptionGroups(resetGroups);

		setPrintingMethod("اختر");
		setPrintLocation("اختر");

		setHasUnsavedChanges(true);
		setShowSaveButton(true);
		setSavedSuccessfully(false);
	};

	const handleOptionChange = (setter: (v: string) => void, value: string) => {
		setter(value);
		if (!cartItemId) {
			setHasUnsavedChanges(true);
		} else {
			setShowSaveButton(true);
			setHasUnsavedChanges(true);
			setSavedSuccessfully(false);
		}
	};

	const handleGroupChange = (groupName: string, value: string) => {
		setOptionGroups((prev) => {
			const next = { ...prev, [groupName]: value };
			if (cartItemId) {
				setHasUnsavedChanges(true);
				setShowSaveButton(true);
				setSavedSuccessfully(false);
			}
			return next;
		});
	};

	if ((loading && formLoading) || formLoading) return <StickerFormSkeleton />;

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
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className="pt-4 mt-4"
		>
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
				{/* SIZE */}
				{needSize && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && needSize && size === "اختر"}>
							<InputLabel>المقاس</InputLabel>
							<Select value={size} onChange={(e) => handleOptionChange(setSize, e.target.value as string)} label="المقاس" className="bg-white">
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

				{/* COLOR */}
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
											{c.hex_code && (
												<div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex_code }} />
											)}
											<span>{c.name}</span>
										</div>
									</MenuItem>
								))}
							</Select>

							{showValidation && needColor && color === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار اللون</FormHelperText>}
						</FormControl>
					</Box>
				)}

				{/* MATERIAL */}
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

				{/* ✅ OPTIONS GROUPS */}
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
									onChange={(e) => handleGroupChange(groupName, e.target.value as string)}
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

								{fieldError && <FormHelperText className="text-red-500 text-xs">يجب اختيار {groupName}</FormHelperText>}
							</FormControl>
						</Box>
					);
				})}

				{/* ✅ PRINTING METHOD */}
				{needPrintingMethod && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printingMethod === "اختر"}>
							<InputLabel>طريقة الطباعة</InputLabel>
							<Select
								value={printingMethod}
								onChange={(e) => handleOptionChange(setPrintingMethod, e.target.value as string)}
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

				{/* ✅ PRINT LOCATION */}
				{needPrintLocation && (
					<Box>
						<FormControl fullWidth size="small" required error={showValidation && printLocation === "اختر"}>
							<InputLabel>مكان الطباعة</InputLabel>
							<Select
								value={printLocation}
								onChange={(e) => handleOptionChange(setPrintLocation, e.target.value as string)}
								label="مكان الطباعة"
								className="bg-white"
							>
								<MenuItem value="اختر" disabled>
									<em className="text-gray-400">اختر</em>
								</MenuItem>
								{apiData.print_locations.map((p: any) => (
									<MenuItem key={p.id} value={p.name}>
										<div className="flex items-center justify-between gap-3 w-full">
											<span>{p.name}</span>
											<span className="text-xs font-black text-slate-500">{p.type}</span>
										</div>
									</MenuItem>
								))}
							</Select>

							{showValidation && printLocation === "اختر" && <FormHelperText className="text-red-500 text-xs">يجب اختيار مكان الطباعة</FormHelperText>}
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

StickerForm.displayName = "StickerForm";
export default StickerForm;
