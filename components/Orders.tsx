"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import { FiSearch } from "react-icons/fi";
import NoOrders from "./NoOrders";
import Image from "next/image";
import Link from "next/link";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
import { ClipboardList, Package, ShoppingCartIcon } from "lucide-react";

interface Order {
	id: number;
	order_number: string;
	status: string;
	payment_status?: string;
	formatted_total: string;
	items_count: number;
	created_at: string;
	can_cancel: boolean;
	items: any[];
}

/* ---------------- Skeleton bits ---------------- */

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"sk-shimmer",
				className,
			].join(" ")}
		/>
	);
}

function OrdersSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div dir="rtl" className="space-y-5">
			{/* Header skeleton */}
			<div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div className="space-y-2">
							<Sk className="h-6 w-28" />
							<Sk className="h-4 w-48" />
						</div>
						<div className="flex flex-row gap-3 w-full md:w-auto">
							<div className="w-full md:w-[420px]">
								<Sk className="h-11 w-full rounded-xl" />
							</div>
							<Sk className="h-11 w-20 rounded-xl" />
						</div>
					</div>
					{/* Filters skeleton */}
					<div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
						<Sk className="h-9 w-24 rounded-lg" />
						<Sk className="h-9 w-28 rounded-lg" />
						<Sk className="h-9 w-32 rounded-lg" />
						<Sk className="h-9 w-20 rounded-lg" />
						<Sk className="h-9 w-24 rounded-lg" />
					</div>
				</div>
			</div>

			{/* Cards skeleton */}
			<div className="grid gap-4">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
					>
						<div className="p-4 flex items-center gap-4">
							{/* Image skeleton */}
							<Sk className="h-[100px] w-[100px] rounded-xl flex-shrink-0" />
							
							{/* Order Info skeleton */}
							<div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
								<div className="space-y-2">
									<Sk className="h-5 w-40" />
									<Sk className="h-4 w-32" />
								</div>
								{/* Status skeleton */}
								<Sk className="h-8 w-24 rounded-lg" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ---------------- Helpers ---------------- */

function statusUI(status: string, t: any) {
	if (status === "pending")
		return { label: t('order_status_pending'), cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" };
	if (status === "waiting" || status === "processing")
		return { label: t('order_status_processing'), cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" };
	if (status === "completed")
		return { label: t('order_status_completed'), cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };
	if (status === "rejected" || status === "cancelled")
		return { label: t('order_status_rejected'), cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" };
	return { label: status, cls: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

function paymentStatusUI(status: string, t: any) {
	if (status === "paid")
		return { label: t('payment_status_paid'), cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" };
	if (status === "pending")
		return { label: t('payment_status_pending'), cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" };
	if (status === "failed")
		return { label: t('payment_status_failed'), cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" };
	return { label: t('payment_status_unknown'), cls: "bg-slate-50 text-slate-700 ring-1 ring-slate-200" };
}

/* ---------------- Component ---------------- */

type FilterType = "all" | "pending" | "waiting" | "completed" | "rejected";

export default function Orders() {
	const { t, language } = useLanguage();
	const [search, setSearch] = useState<string>("");
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [filter, setFilter] = useState<FilterType>("all");

	const [page, setPage] = useState<number>(1);
	const [lastPage, setLastPage] = useState<number>(1);
	const [apiToken, setApiToken] = useState<string | null>(null);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		if (typeof window !== "undefined") {
			const token = localStorage.getItem("auth_token");
			setApiToken(token);
		}
	}, []);

	useEffect(() => {
		if (!apiToken) return;

		const fetchOrders = async () => {
			setLoading(true);
			try {
				const res = await fetch(`${baseUrl}/order?page=${page}`, {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiToken}`,
						"Accept-Language": language,
						Accept: "application/json"
					},
					cache: "no-store",
				});

				const data = await res.json();

				if (data.status && data.data?.data) {
					setOrders(data.data.data);
					setLastPage(data.data.meta.last_page);
				} else {
					setOrders([]);
					setLastPage(1);
				}
			} catch (error) {
				console.error("Error fetching orders:", error);
				setOrders([]);
				setLastPage(1);
			} finally {
				setLoading(false);
			}
		};

		fetchOrders();
	}, [apiToken, baseUrl, page]);

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		setPage(1);
	};

	const handleFilterChange = (newFilter: FilterType) => {
		setFilter(newFilter);
		setPage(1);
	};

	// ✅ useMemo to avoid filtering on every render
	const filteredOrders = useMemo(() => {
		let result = orders;

		// Apply status filter
		if (filter !== "all") {
			if (filter === "waiting") {
				result = result.filter((order) => order.status === "waiting" || order.status === "processing");
			} else if (filter === "rejected") {
				result = result.filter((order) => order.status === "rejected" || order.status === "cancelled");
			} else {
				result = result.filter((order) => order.status === filter);
			}
		}

		// Apply search filter
		const q = search.trim();
		if (q) {
			result = result.filter((order) => order.order_number.includes(q));
		}

		return result;
	}, [orders, search, filter]);

	if (loading) return <OrdersSkeleton count={4} />;

	return (
		<div  className="space-y-5 md:mt-0 mt-5">
			{/* Empty state */}
			{orders.length === 0 ? (
				<div className=" mt-12 flex items-center flex-col">
					<Image src="/images/no-order.png" width={230} height={220} alt="notfound" />
					<NoOrders title={t('no_orders')} />
				</div>
			) : (
				<>
					{/* Header */}
					<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
						<div className="flex flex-col gap-4">
							<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
								<div>
									<h2 className="text-xl font-extrabold text-slate-900">{t('orders')}</h2>
									
								</div>

								<div className="flex flex-row gap-3 w-full md:w-auto">
									<div className="relative w-full md:w-[420px]">
										<FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										placeholder={t('search_order_number')}
										value={search}
										onChange={handleSearchChange}
										className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-3 text-sm font-semibold text-slate-900
                               placeholder:text-slate-400 outline-none transition
                               focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20  duration-200"
									/>
									</div>

									<div className="text-nowrap max-md:text-xs inline-flex items-center justify-center rounded-xl bg-slate-50 max-md:p-2 px-4 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
										{filteredOrders.length} {t('order_singular')}
									</div>
								</div>
							</div>

							{/* Filters */}
							<div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-slate-200">
								<button
									onClick={() => handleFilterChange("all")}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										filter === "all"
											? "bg-pro-max text-white"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t('all_orders')}
								</button>
								<button
									onClick={() => handleFilterChange("pending")}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										filter === "pending"
											? "bg-pro-max text-white"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t('order_status_pending')}
								</button>
								<button
									onClick={() => handleFilterChange("waiting")}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										filter === "waiting"
											? "bg-pro-max text-white"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t('order_status_processing')}
								</button>
								<button
									onClick={() => handleFilterChange("completed")}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										filter === "completed"
											? "bg-pro-max text-white"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t('order_status_completed')}
								</button>
								<button
									onClick={() => handleFilterChange("rejected")}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										filter === "rejected"
											? "bg-pro-max text-white"
											: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
								>
									{t('order_status_rejected')}
								</button>
							</div>
						</div>
					</div>

					{/* List */}
					{filteredOrders.length === 0 ? (
						<NoOrders title={t('no_orders')} />
					) : (
						<div className="grid gap-4">
							{filteredOrders.map((order) => {
								const item = order.items?.[0];
								const img = item?.product?.image || "/images/noimg.png";
								const status = statusUI(order.status, t);

								return (
									<Link
										key={order.id}
										href={`/myAccount/${order.id}`}
										className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-pro transition-all duration-200 cursor-pointer"
									>
										<div className="p-4 flex  md:items-center gap-2 md:gap-4">
											{/* Image */}
											<div className="flex-shrink-0">
												<Image
													src={img}
													alt="Order"
													width={100}
													height={100}
													className="rounded-xl object-cover ring-1 ring-black/5 bg-slate-50"
												/>
											</div>

											{/* Order Info */}
											<div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
												<div className="space-y-2">
													<p className="text-slate-900 font-bold text-xs md:text-sm">
														{t('order_id')}: <span className="font-extrabold">{order.order_number}</span>
													</p>
													<p className="text-slate-700 font-semibold text-xs md:text-sm">
														{t('total_paid')}: <span className="font-extrabold text-pro-max">{order.formatted_total}</span>
													</p>
												</div>

												{/* Status */}
												<div className="flex-shrink-0">
													<span className={`inline-flex px-4 py-2 rounded-lg text-xs md:text-sm font-bold ${status.cls}`}>
														{status.label}
													</span>
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{lastPage > 1 && (
						<div className="flex justify-center mt-6">
							<Stack spacing={2}>
								<Pagination
									count={lastPage}
									page={page}
									onChange={(event, value) => setPage(value)}
									color="primary"
									sx={{
										"& .MuiPaginationItem-icon": {
											transform: "scaleX(-1)",
										},
									}}
								/>
							</Stack>
						</div>
					)}
				</>
			)}
		</div>
	);
}
