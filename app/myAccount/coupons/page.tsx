"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/src/context/LanguageContext";

type FilterType = "all" | "active" | "used" | "expired";

interface Coupon {
	id: number;
	code: string;
	discount: string;
	status: "active" | "used" | "expired";
	expires_at?: string;
	used_at?: string;
	role?: string; // e.g., "خصم على الطلب", "خصم على الشحن", etc.
}

export default function coupons() {
	const { t } = useLanguage();
	const [filter, setFilter] = useState<FilterType>("all");
	// Sample data for visualization - replace with actual API call
	const [coupons, setCoupons] = useState<Coupon[]>([
		{
			id: 1,
			code: "SAVE20",
			discount: "20%",
			status: "active",
			expires_at: "2024-12-31",
			role: t("active")
		},
		{
			id: 2,
			code: "FREESHIP",
			discount: "50 ج.م",
			status: "active",
			expires_at: "2024-11-30",
			role: t("active")
		},
		{
			id: 3,
			code: "WELCOME10",
			discount: "10%",
			status: "used",
			used_at: "2024-10-15",
			role: t("used")
		},
		{
			id: 4,
			code: "SUMMER25",
			discount: "25%",
			status: "expired",
			expires_at: "2024-09-30",
			role: t("expired")
		},
	]);

	// Filter coupons based on selected filter
	const filteredCoupons = useMemo(() => {
		if (filter === "all") return coupons;
		return coupons.filter((coupon) => coupon.status === filter);
	}, [coupons, filter]);

	const handleFilterChange = (newFilter: FilterType) => {
		setFilter(newFilter);
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6 md:mt-0 mt-5">
			<div className="mb-6">
				<h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">{t("my_coupons")}</h1>
				
				{/* Filters */}
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => handleFilterChange("all")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							filter === "all"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						{t("show")} {t("all_results")}
					</button>
					<button
						onClick={() => handleFilterChange("active")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							filter === "active"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						{t("active")}
					</button>
					<button
						onClick={() => handleFilterChange("used")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							filter === "used"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						{t("used")}
					</button>
					<button
						onClick={() => handleFilterChange("expired")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							filter === "expired"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						{t("expired")}
					</button>
				</div>
			</div>
			
			{/* Coupons List or Empty State */}
			{filteredCoupons.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-slate-600 text-lg mb-2">{t("no_coupons_available")}</p>
					<p className="text-slate-500 text-sm">{t("coupons_will_appear_here")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{filteredCoupons.map((coupon) => {
						const isActive = coupon.status === "active";
						const isUsed = coupon.status === "used";
						const isExpired = coupon.status === "expired";

						return (
							<div
								key={coupon.id}
								className={`
									rounded-lg border transition-all duration-200
									${isActive 
										? "border-pro-max bg-orange-50" 
										: "border-slate-200 bg-slate-50 opacity-70"
									}
								`}
							>
								<div className="p-4">
									{/* Status Badge */}
									<div className="flex items-center justify-between mb-3">
										<span
											className={`
												px-2 py-0.5 rounded text-xs font-semibold
												${isActive
													? "bg-emerald-500 text-white"
													: isUsed
													? "bg-slate-400 text-white"
													: "bg-rose-500 text-white"
												}
											`}
										>
											{t(coupon.status)}
										</span>
									</div>

									{/* Coupon Code */}
									<div className="mb-2">
										<p className="text-lg font-bold text-slate-900 font-mono">
											{coupon.code}
										</p>
									</div>

									{/* Discount Value */}
									<div className="mb-2">
										<p className={`text-xl font-bold ${isActive ? "text-pro-max" : "text-slate-600"}`}>
											{coupon.discount}
										</p>
									</div>

									{/* Role/Type */}
									{coupon.role && (
										<p className="text-xs text-slate-600 mb-2">{coupon.role}</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

