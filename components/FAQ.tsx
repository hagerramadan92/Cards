"use client";

import { useEffect, useMemo, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/src/context/LanguageContext";

interface FAQItem {
	id: number;
	question: string;
	answer: string;
}

/* ---------------- Skeleton ---------------- */

function Sk({ className = "" }: { className?: string }) {
	return (
		<div
			className={[
				"relative overflow-hidden rounded-xl bg-gray-200 ring-1 ring-black/5",
				"animate-pulse",
				className,
			].join(" ")}
		/>
	);
}

function FAQSkeleton({ count = 6 }: { count?: number }) {
	return (
		<section className="relative container overflow-hidden bg-white text-slate-800">
			<div className="relative container pb-8">
				<div className="mb-5 text-center">
					<Sk className="h-10 w-64 mx-auto" />
					<Sk className="mt-2 h-5 w-96 mx-auto" />
				</div>

				<div className="container">
					<div className="max-w-3xl mx-auto mt-0">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-0 p-6 md:p-8">
							<Sk className="h-11 w-full rounded-lg" />
						</div>
					</div>
				</div>

				<div className="container mt-5">
					<div className="max-w-3xl mx-auto space-y-4">
						{Array.from({ length: count }).map((_, i) => (
							<div
								key={i}
								className="rounded-lg border border-slate-200 bg-white shadow-sm p-4"
							>
								<div className="flex items-center justify-between gap-3">
									<Sk className="h-5 w-3/4" />
									<Sk className="h-9 w-9 rounded-lg" />
								</div>
								<Sk className="mt-3 h-4 w-11/12" />
								<Sk className="mt-2 h-4 w-9/12" />
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ---------------- Page ---------------- */

export default function FAQPage() {
	const [faqs, setFaqs] = useState<FAQItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [openId, setOpenId] = useState<number | null>(null);
	const [q, setQ] = useState("");

	const base_url = process.env.NEXT_PUBLIC_API_URL;
	const { language } = useLanguage();

	useEffect(() => {
		const fetchFAQs = async () => {
			try {
				const res = await fetch(`${base_url}/faqs`, {
					headers: {
						"Accept-Language": language,
					},
					cache: "no-store",
				});
				const data = await res.json();
				if (data?.status) {
					setFaqs(data.data || []);
					// افتح أول سؤال بشكل لطيف (اختياري)
					if (Array.isArray(data.data) && data.data.length) {
						setOpenId(data.data[0].id);
					}
				} else {
					setFaqs([]);
				}
			} catch (err) {
				console.error(err);
				setFaqs([]);
			} finally {
				setLoading(false);
			}
		};

		fetchFAQs();
	}, [base_url, language]);

	const filteredFaqs = useMemo(() => {
		const s = q.trim();
		if (!s) return faqs;

		return faqs.filter(
			(f) => f.question.includes(s) || f.answer.includes(s)
		);
	}, [faqs, q]);

	if (loading) return <FAQSkeleton count={6} />;

	return (
		<section className="relative container overflow-hidden bg-white text-slate-800">
			{/* Soft background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-pro/10 blur-3xl" />
				<div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-slate-300/20 blur-3xl" />
			</div>

			<div className="relative container pb-8">
				{/* Hero */}
				<div className="mb-5 text-center">
					<h1 className="max-md:text-center mt-4 text-pro text-3xl md:text-4xl font-extrabold text-slate-950 leading-tight">
						الأسئلة <span className="text-pro-max">الشائعة</span>
					</h1>
					<p className="mt-2">
						ابحث عن إجابتك بسرعة أو افتح السؤال لمعرفة التفاصيل.
					</p>
				</div>

				{/* Content */}
				<div className="container">
					<div className="max-w-3xl mx-auto mt-0 mb-5">
						<div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-0">
							{/* Search */}
							<div className="p-6 md:p-8">
								<div className="flex flex-col md:flex-row md:items-center gap-3">
									<div className="relative flex-1">
										<input
											value={q}
											onChange={(e) => setQ(e.target.value)}
											placeholder="ابحث: استرجاع، شحن، ضمان..."
											className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 duration-200"
										/>
									</div>

									<div className="inline-flex items-center justify-center rounded-lg bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
										{filteredFaqs.length} نتيجة
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* FAQ Items */}
				<div className="container mt-5">
					<div className="max-w-3xl mx-auto">
						{/* Empty */}
						{filteredFaqs.length === 0 ? (
							<div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-7 text-center">
								<p className="text-slate-900 font-extrabold text-lg">
									لا توجد أسئلة مطابقة للبحث
								</p>
								<p className="mt-2 text-sm text-slate-600">
									جرّب كلمات أخرى مثل: استرجاع، شحن، ضمان.
								</p>

								<button
									onClick={() => setQ("")}
									className="mt-4 rounded-lg bg-pro px-6 py-3 text-sm font-extrabold text-white hover:opacity-95 transition"
								>
									مسح البحث
								</button>
							</div>
						) : (
							<div className="space-y-4">
								{filteredFaqs.map((faq) => {
									const isOpen = openId === faq.id;

									return (
										<div
											key={faq.id}
											className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
										>
											{/* Title */}
											<button
												aria-label="toggle faq"
												onClick={() => setOpenId(isOpen ? null : faq.id)}
												className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-right cursor-pointer bg-white hover:bg-slate-50 transition"
											>
												<div className="min-w-0 flex-1">
													<p className="text-slate-900 font-extrabold text-base md:text-lg">
														{faq.question}
													</p>
													<p className="mt-1 text-xs md:text-sm text-slate-500 line-clamp-1">
														اضغط لعرض الإجابة
													</p>
												</div>

												<motion.span
													animate={{ rotate: isOpen ? 180 : 0 }}
													transition={{ type: "spring", stiffness: 260, damping: 20 }}
													className="grid place-items-center h-10 w-10 rounded-lg bg-slate-50 text-slate-700 ring-1 ring-slate-200 shrink-0"
												>
													<IoIosArrowDown />
												</motion.span>
											</button>

											{/* Answer */}
											<AnimatePresence initial={false}>
												{isOpen && (
													<motion.div
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.25, ease: "easeInOut" }}
														className="overflow-hidden"
													>
														<div className="px-4 md:px-5 pb-4">
															<div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
																<p className="text-slate-700 text-sm md:text-base leading-7 whitespace-pre-line">
																	{faq.answer}
																</p>
															</div>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
