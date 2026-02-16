"use client";

import UserNameWelcome from "@/components/UserNameWelcome";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";

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
	const { t } = useLanguage();
	
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
							{t('common.read_more')}
							<MdOutlineKeyboardArrowLeft className="text-pro transition group-hover:translate-x-[-2px]" />
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default function Page() {
	const { t } = useLanguage();
	const [q, setQ] = useState("");

	const items: HelpItem[] = [
		{
			href: "/FAQ",
			title: t('faq.title'),
			desc: t('faq.desc'),
			icon: <TiMessages size={24} />,
			badge: t('faq.badge'),
		},
		{
			href: "/returnsPolicy",
			title: t('returns.title'),
			desc: t('returns.desc'),
			icon: <BsArrowReturnLeft size={22} />,
		},
		{
			href: "/policy",
			title: t('privacy.title'),
			desc: t('privacy.desc'),
			icon: <BsShieldCheck size={22} />,
		},
		{
			href: "/terms",
			title: t('terms.title'),
			desc: t('terms.desc'),
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
	}, [q, items]);

	return (
		<div className="space-y-3 md:mt-0 mt-5">
		
			{/* Search Bar - يمكن إضافته لاحقاً إذا أردت */}
			{/* <div className="relative mb-4">
				<FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
				<input
					type="text"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder={t('help.search_placeholder')}
					className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pro focus:outline-none focus:ring-2 focus:ring-pro/20"
				/>
			</div> */}

			{/* Help Cards Grid */}
			{/* {filtered.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{filtered.map((item, idx) => (
						<Card key={idx} item={item} />
					))}
				</div>
			) : (
				<div className="text-center py-8">
					<p className="text-slate-500">{t('help.no_results')}</p>
				</div>
			)} */}

			{/* Support Tickets Section */}
			<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex gap-3">
					<div className="w-10 h-10 rounded-lg bg-pro/10 flex items-center justify-center flex-shrink-0">
						<FaTicketAlt className="text-pro-max" size={24} />
					</div>
					<div className="flex flex-col gap-1 flex-1">
						<h3 className="text-lg font-semibold text-slate-900">{t('support.tickets_card.title')}</h3>
						<p className="text-slate-500 text-sm">{t('support.tickets_card.no_tickets')}</p>
					</div>
				</div>
				
				<Link href="/myAccount/support">
					<button className="w-full mt-4 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-pro-max font-semibold text-sm transition-colors">
						{t('support.tickets_card.view_all')}
					</button>
				</Link>
			</div>

			{/* Watch Tutorials Section */}
			<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex gap-3 mb-2">
					<div className="w-10 h-10 rounded-lg bg-pro/10 flex items-center justify-center flex-shrink-0">
						<FaPlayCircle className="text-pro-max" size={24} />
					</div>
					<div className="flex flex-col gap-1 flex-1">
						<h3 className="text-lg font-semibold text-slate-900">{t('tutorials.title')}</h3>
						<p className="text-sm text-slate-500">
							{t('tutorials.desc')}
						</p>
					</div>
				</div>
				
				<Link href="/tutorials">
					<button className="w-full mt-2 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-pro-max font-semibold text-sm transition-colors">
						{t('tutorials.watch_videos')}
					</button>
				</Link>
			</div>
		</div>
	);
}