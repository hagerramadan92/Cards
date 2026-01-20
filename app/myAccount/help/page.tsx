"use client";

import UserNameWelcome from "@/components/UserNameWelcome";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TfiMenuAlt } from "react-icons/tfi";
import { TiMessages } from "react-icons/ti";
import { FiSearch } from "react-icons/fi";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { BsShieldCheck, BsArrowReturnLeft } from "react-icons/bs";
import { FaTicketAlt } from "react-icons/fa";
import { FaPlayCircle } from "react-icons/fa";

type HelpItem = {
	href: string;
	title: string;
	desc: string;
	icon: React.ReactNode;
	badge?: string;
};

function Card({
	item,
}: {
	item: HelpItem;
}) {
	return (
		<Link href={item.href} aria-label={item.title} className="group">
			<div
				className="
          relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 md:p-5
          shadow-sm transition
          hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300
          focus:outline-none
        "
			>
				{/* subtle shine */}
				<div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
					<div className="absolute -left-24 top-0 h-full w-40 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
				</div>

				<div className="flex items-start gap-4">
					<div
						className="
              grid h-12 w-12 place-items-center rounded-2xl
              bg-slate-50 text-[#233a7d] ring-1 ring-slate-200
              group-hover:bg-[#eff6ff] group-hover:ring-[#c7ddff]
              transition
            "
					>
						{item.icon}
					</div>

					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-3">
							<h5 className="text-base md:text-lg font-extrabold text-slate-900 truncate">
								{item.title}
							</h5>

							{item.badge ? (
								<span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
									{item.badge}
								</span>
							) : null}
						</div>

						<p className="mt-1 text-sm text-slate-600 leading-6 line-clamp-2">
							{item.desc}
						</p>

						<div className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-pro">
							اقرأ المزيد
							<MdOutlineKeyboardArrowLeft className="text-pro transition group-hover:translate-x-[-2px]" />
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default function Page() {
	const [q, setQ] = useState("");

	const items: HelpItem[] = [
		{
			href: "/FAQ",
			title: "الأسئلة الشائعة",
			desc: "تعرف على المزيد حول الاسترداد، الدفع عند الاستلام، والضمان.",
			icon: <TiMessages size={24} />,
			badge: "الأكثر زيارة",
		},
		{
			href: "/returnsPolicy",
			title: "سياسة الاسترجاع",
			desc: "تعرف على شروط وإجراءات الاسترجاع بسهولة وخطوات التنفيذ.",
			icon: <BsArrowReturnLeft size={22} />,
		},
		{
			href: "/policy",
			title: "سياسة الخصوصية",
			desc: "كيف نحمي بياناتك ونضمن خصوصيتك أثناء استخدام الموقع.",
			icon: <BsShieldCheck size={22} />,
		},
		{
			href: "/terms",
			title: "الشروط والأحكام",
			desc: "القواعد التي تنظم استخدامك لخدماتنا والالتزامات المتبادلة.",
			icon: <TfiMenuAlt size={21} />,
		},
	];

	const filtered = useMemo(() => {
		const s = q.trim();
		if (!s) return items;
		return items.filter(
			(it) =>
				it.title.includes(s) ||
				it.desc.includes(s)
		);
	}, [q]);

	return (
		<div className="space-y-3 md:mt-0 mt-5">
		

		{/* Support Tickets Section */}
		<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex gap-1">
				<div className="w-8 h-8 rounded-lg bg-pro/10 flex items-center justify-center">
					<FaTicketAlt className="text-pro-max" size={28} />
				</div>
				<div className="flex flex-col gap-1">
				<h3 className="text-lg font-semibold text-slate-900">تذاكر الدعم</h3>
				<p className="text-slate-500 text-sm">لا توجد تذاكر للعرض</p>
				</div>

			</div>
			
			<button className="px-3 py-1.5 hover:bg-orange-200 rounded-lg text-pro-max bg-orange-100 w-full text-center mt-2 text-white text-sm font-semibold hover:bg-pro-max/90 transition-colors">
				عرض جميع التذاكر
			</button>
		</div>

		{/* Watch Tutorials Section */}
		<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex gap-1 mb-2">
				<div className="w-8 h-8 rounded-lg bg-pro/10 flex items-center justify-center">
					<FaPlayCircle className="text-pro-max" size={28} />
				</div>
				  <div className="flex flex-col gap-1">
				  <h3 className="text-lg font-semibold text-slate-900">مشاهدة الدروس التعليمية</h3>
				<p className="text-sm text-slate-500 mb-3">
				تحقق من دروسنا التعليمية المصورة التي ترشدك عبر تطبيقات لايك كارد.
			</p>
				  </div>
			</div>
			
			<button className="px-3 py-1.5 hover:bg-orange-200 rounded-lg text-pro-max bg-orange-100 w-full text-center mt-2 text-white text-sm font-semibold hover:bg-pro-max/90 transition-colors">
				مشاهدة فيديوهات الدروس التعليمية
			</button>
		</div>

			
		</div>
	);
}



