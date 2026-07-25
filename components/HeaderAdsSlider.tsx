"use client";

import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLanguage } from "@/src/context/LanguageContext";
import { Autoplay } from "swiper/modules";

import "swiper/css";

type Ad = {
	id: number;
	description: string;
	icon: string;
};

type ApiResponse = {
	status: boolean;
	message: string;
	data: Ad[];
};

function faToEmoji(icon: string) {
	const map: Record<string, string> = {
		"fa-truck-fast": "🚚",
		"fa-percent": "％",
		"fa-gift": "🎁",
		"fa-fire": "🔥",
		"fa-rocket": "🚀",
		"fa-boxes-stacked": "📦",
		"fa-star": "⭐",
		"fa-user-plus": "👤",
		"fa-bolt": "⚡",
		"fa-calendar-week": "🗓️",
		"fa-truck": "🚛",
	};
	return map[icon] ?? "ℹ️";
}

/* ---------------- Skeleton ---------------- */
function HeaderAdsSkeleton() {
	return (
		<div className="w-full border-b" style={{ background: "var(--nav-top-background)", borderColor: "var(--nav-border)" }}>
			<div className="app-container flex h-10 items-center justify-center px-4">
				<div className="flex w-full max-w-md items-center gap-2">
					<div className="h-4 w-4 animate-pulse rounded" style={{ background: "var(--surface-subtle)" }} />
					<div className="h-4 w-full animate-pulse rounded" style={{ background: "var(--surface-subtle)" }} />
				</div>
			</div>
		</div>
	);
}

export default function HeaderAdsSlider() {
	const { language } = useLanguage();
	const [ads, setAds] = useState<Ad[]>([]);
	const [loading, setLoading] = useState(true);

	const apiBase = process.env.NEXT_PUBLIC_API_URL;

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setLoading(true);
				const res = await fetch(`${apiBase}/ads`, {
					headers: { "Accept-Language": language },
					cache: "no-store"
				});
				const json = (await res.json()) as ApiResponse;

				if (!cancelled && json?.status && Array.isArray(json.data)) {
					setAds(json.data);
				}
			} catch {
				if (!cancelled) setAds([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		if (apiBase) load();
		else setLoading(false);

		return () => {
			cancelled = true;
		};
		}, [apiBase, language]);

	const slides = useMemo(() => {
		if (ads.length <= 1) return ads;
		return [...ads, ...ads];
	}, [ads]);
	/* ---------- Skeleton ---------- */
	if (loading) {
		return <HeaderAdsSkeleton />;
	}

	if (!slides.length) {
		return (
			<div
				className="h-10 w-full border-b"
				style={{
					background: "var(--nav-top-background)",
					borderColor: "var(--nav-border)",
				}}
				aria-hidden="true"
			/>
		);
	}

	return (
		<div
			className="w-full border-b"
			style={{ background: "var(--nav-top-background)", borderColor: "var(--nav-border)", color: "var(--text-secondary)" }}
		>
			<div className="app-container px-2 sm:px-4">
				<Swiper
					modules={[Autoplay]}
					loop
					slidesPerView={1}
					speed={700}
					autoplay={{
						delay: 2500,
						disableOnInteraction: false,
						pauseOnMouseEnter: true,
					}}
					className="h-10"
				>
					{slides.map((ad, idx) => (
						<SwiperSlide
							key={`${ad.id}-${idx}`}
							className="!flex items-center"
						>
							<div className="mx-auto flex w-full items-center justify-center gap-2 px-2 text-center text-sm sm:text-[15px]">
								<span className="text-base text-orange-400">
									{faToEmoji(ad.icon)}
								</span>
								<span className="truncate">{ad.description}</span>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);
}
