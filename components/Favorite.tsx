"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import NoOrders from "./NoOrders";
import { useAuth } from "@/src/context/AuthContext";
import FavoriteSkeleton from "@/components/skeletons/favorite";
import Image from "next/image";

type ViewType = "cards" | "carts";

export default function Favorite() {
	const { favoriteProducts, setFavoriteProducts, favoriteProductsLoading } = useAuth();
	const [viewType, setViewType] = useState<ViewType>("cards");

	const removeFavoriteLocally = (productId: number) => {
		setFavoriteProducts((prev: any) => prev.filter((p: any) => p.id !== productId));
	};

	if (favoriteProductsLoading) return <FavoriteSkeleton count={8} />;

	return (
		<div>
			<div className="mb-6">
				<div className="flex items-center justify-between gap-3 mb-4">
					<div>
						<h2 className="text-xl md:text-2xl font-semibold text-slate-900">
							منتجاتي المفضلة
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							كل المنتجات التي قمت بحفظها للعودة إليها لاحقًا.
						</p>
					</div>

					{favoriteProducts.length > 0 && (
						<span className="rounded-xl text-nowrap bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
							{favoriteProducts.length} منتج
						</span>
					)}
				</div>

				{/* View Filters */}
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setViewType("cards")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							viewType === "cards"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						بطاقات
					</button>
					<button
						onClick={() => setViewType("carts")}
						className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
							viewType === "carts"
								? "bg-pro-max text-white"
								: "bg-slate-100 text-slate-700 hover:bg-slate-200"
						}`}
					>
						عربات
					</button>
				</div>
			</div>

			{/* Empty State */}
			{favoriteProducts.length === 0 ? (
				<NoOrders title="لا يوجد منتجات مفضلة." />
			) : (
				<>
					{/* Cards View */}
					{viewType === "cards" && (
						<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
							{favoriteProducts.map((product: any) => (
								<ProductCard
									product={product}
									key={product.id}
									{...product}
									onFavoriteChange={() => removeFavoriteLocally(product.id)}
									Bottom="bottom-41"
									className2="hidden"
								/>
							))}
						</div>
					)}

					{/* Carts View (List View) */}
					{viewType === "carts" && (
						<div className="space-y-4">
							{favoriteProducts.map((product: any) => (
								<div
									key={product.id}
									className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex gap-4">
										<div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
											<Image
												src={product.image || "/images/noimg.png"}
												alt={product.name || "Product"}
												fill
												className="object-cover"
											/>
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
												{product.name}
											</h3>
											<div className="flex items-center justify-between gap-4">
												<div>
													{product.final_price && (
														<p className="text-lg font-bold text-pro-max">
															{product.final_price}
														</p>
													)}
													{product.price && product.final_price !== product.price && (
														<p className="text-sm text-slate-500 line-through">
															{product.price}
														</p>
													)}
												</div>
												<button
													onClick={() => removeFavoriteLocally(product.id)}
													className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-semibold"
												>
													إزالة
												</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}
