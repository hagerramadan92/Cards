"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import { HiOutlineSquares2X2, HiOutlineFolderOpen } from "react-icons/hi2";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";

interface Category {
	id: number;
	name: string;
	slug: string;
	description?: string;
	image?: string;
	sub_image?: string;
	is_parent?: boolean;
	children?: Category[];
}

/* -------------------- Skeleton (Shimmer) -------------------- */
function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-slate-200/70 ring-1 ring-black/5",
				"sk-shimmer",
				className,
			].join(" ")}
		/>
	);
}

function CategoryCardSkeleton() {
	return (
		<div className="rounded-lg border border-slate-100 bg-white overflow-hidden shadow-sm w-[140px] h-[110px] md:w-[192.83px] md:h-[151px] mx-auto flex flex-col items-center justify-center gap-1 md:gap-2">
			<div className="relative w-[120px] h-[70px] md:w-[162.83px] md:h-[96px] mt-1.5 md:mt-3">
				<Sk className="absolute inset-0 rounded-none" />
			</div>
			<Sk className="h-4 w-20 md:h-5 md:w-24 rounded" />
		</div>
	);
}

/* -------------------- Card -------------------- */
function CategoryCard({ category }: { category: Category }) {
	const childrenCount = category.children?.length ?? 0;

	return (
		<motion.div
			layout
			whileHover={{ y: -6 }}
			transition={{ type: "spring", stiffness: 260, damping: 18 }}
			className="group rounded-lg border border-slate-100 cursor-pointer 
			bg-white mx-auto overflow-hidden shadow-sm 
			hover:shadow-md w-[140px] sm:w-[160px]
			h-[110px] sm:h-[130px] md:w-[192.83px] md:h-[151px]"
		>
			<Link href={`/category/${category.id}`} className="flex flex-col items-center justify-center gap-1 md:gap-2">
				{/* Image */}
				<div className="relative bg-slate-50 mt-1.5 md:mt-3 w-[120px] h-[70px] md:w-[162.83px] md:h-[96px]">
					<Image
						src={category.image || "/images/noimg.png"}
						alt={category.name}
						fill
						sizes="(max-width: 768px) 100vw, 25vw"
						className="object-cover  transition-transform duration-500 group-hover:scale-[1.04]"
					/>
					
				</div>
					
					<h3 className="text-xs md:text-sm line-clamp-1 drop-shadow text-center px-2">
						{category.name}
					</h3>
								
				
			</Link>
		</motion.div>
	);
}

/* -------------------- Page -------------------- */
export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	const [q, setQ] = useState("");
	const deferredQ = useDeferredValue(q);

	const [onlyParents, setOnlyParents] = useState(false);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setLoading(true);
				const res = await fetch(`${baseUrl}/categories`, { cache: "no-store" });
				const json = await res.json();
				if (json?.status) setCategories(json.data || []);
			} catch (e) {
				console.error(e);
				setCategories([]);
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, [baseUrl]);

	const filtered = useMemo(() => {
		const query = deferredQ.trim().toLowerCase();

		let list = categories;

		if (onlyParents) {
			list = list.filter((c) => c.is_parent);
		}

		if (!query) return list;

		return list.filter((c) => {
			const inName = c.name?.toLowerCase().includes(query);
			const inDesc = c.description?.toLowerCase().includes(query);
			const inChildren =
				c.children?.some((ch) => ch.name?.toLowerCase().includes(query)) ?? false;

			return inName || inDesc || inChildren;
		});
	}, [categories, deferredQ, onlyParents]);

	return (
		<section className="container py-4 md:py-10">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-slate-600 mb-4 ps-3">
				<Link href="/" className="hover:text-pro transition-colors duration-200">
					الرئيسية
				</Link>
				<span className="text-slate-400">›</span>
				<span className="text-slate-900 font-semibold">الأقسام</span>
			</nav>

			<h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 ps-3">الأقسام</h1>

			{/* Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
				{loading
					? Array.from({ length: 10 }).map((_, i) => <CategoryCardSkeleton key={i} />)
					: filtered.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
			</div>

			{!loading && filtered.length === 0 && (
				<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center">
					<p className="text-slate-700 font-bold text-lg">لا توجد نتائج</p>
					<p className="text-slate-500 mt-1">جرّب كلمة بحث مختلفة أو اعرض الكل.</p>
					<button
						onClick={() => {
							setQ("");
							setOnlyParents(false);
						}}
						className="mt-4 px-5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-800"
					>
						إعادة تعيين
					</button>
				</div>
			)}
		</section>
	);
}
