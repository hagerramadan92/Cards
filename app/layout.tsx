// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/screen.css";
import "flag-icons/css/flag-icons.min.css";
import { Toaster } from "react-hot-toast";
import Providers from "./Providers";
import { AppProvider } from "@/src/context/AppContext";
import { ToastProvider } from "@/src/context/ToastContext";
import { Cairo } from "next/font/google";
import LayoutShell from "./LayoutShell";
import '@/lib/fontawesome'
import { AuthProvider } from "@/components/LoginEmail/AuthProvider";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { DataProvider } from "@/src/context/DataContext";

const cairo = Cairo({
	subsets: ["arabic"],
	weight: ["300", "400", "600", "700"],
	display: "swap"
});

// Required for resolving OG/twitter image URLs. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
const metadataBaseUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://flashicard.renix4tech.com/api/v1");

// هذه دالة لجلب البيانات من API للـ Metadata
async function getSiteData() {
	try {
		const API_URL = process.env.NEXT_PUBLIC_API_URL;
		if (!API_URL) return null;

		const res = await fetch(`${API_URL}/setting`, {
			headers: {
				"Accept-Language": "ar",
			},
			next: { revalidate: 3600 } 
		});
		
		if (!res.ok) return null;
		
		const data = await res.json();
		return data?.status ? data.data : null;
	} catch (error) {
		console.error("Error fetching site data:", error);
		return null;
	}
}

// دالة generateMetadata الديناميكية
export async function generateMetadata(): Promise<Metadata> {
	const siteData = await getSiteData();
	
	// إذا وجدنا بيانات من API نستخدمها
	if (siteData?.settings) {
		const settings = siteData.settings;
		const translated = settings.translated_settings;
		const allSettings = settings.all_settings;
		
		const siteTitle = translated.site_title || allSettings.title_website ;
		const siteDescription = translated.site_description ;
		const siteKeywords = translated.site_keywords ;
		const siteName = translated.site_name || allSettings.name_website ;
		
		return {
			metadataBase: metadataBaseUrl,
			title: {
				default: siteDescription,
				template: `%s | ${siteName}`,
			},
			description: siteDescription,
			// ✅修正: تحديد نوع الـ parameter بشكل صريح
			keywords: siteKeywords.split(',').map((k: string) => k.trim()),
			
			authors: [{ name: "LikeCard Team" }],
			creator: "LikeCard",
			publisher: "LikeCard",

			robots: {
				index: true,
				follow: true,
				googleBot: {
					index: true,
					follow: true,
					"max-image-preview": "large",
					"max-snippet": -1,
					"max-video-preview": -1,
				},
			},

			alternates: {
				canonical: "/",
				languages: {
					ar: "/",
				},
			},

			openGraph: {
				type: "website",
				locale: "ar_AR",
				url: "https://your-domain.com",
				siteName: siteName,
				title: siteTitle,
				description: siteDescription,
				images: [
					{
						url: "/og-image.jpg",
						width: 1200,
						height: 630,
						alt: siteName,
					},
				],
			},

			twitter: {
				card: "summary_large_image",
				title: siteName,
				description: siteDescription,
				images: ["/og-image.jpg"],
			},

			icons: {
				icon: "/favicon.ico",
				shortcut: "/favicon-16x16.png",
				apple: "/apple-touch-icon.png",
			},
		};
	}

	// Fallback metadata إذا لم نجد بيانات
	return {
		metadataBase: metadataBaseUrl,
		title: {
			default: "أكبر منصة بطاقات شحن رقمية",
			template: "%s | LikeCard",
		},
		description: "أكبر منصة بطاقات شحن رقمية",
		keywords: ["أكبر منصة بطاقات شحن رقمية", "LikeCard"],
		authors: [{ name: "LikeCard Team" }],
		creator: "LikeCard",
		publisher: "LikeCard",
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-image-preview": "large",
				"max-snippet": -1,
				"max-video-preview": -1,
			},
		},
		alternates: {
			canonical: "/",
			languages: {
				ar: "/",
			},
		},
		openGraph: {
			type: "website",
			locale: "ar_AR",
			url: "https://your-domain.com",
			siteName: "LikeCard",
			title: "LikeCard | أكبر منصة بطاقات شحن رقمية",
			description: "أكبر منصة بطاقات شحن رقمية",
			images: [
				{
					url: "/og-image.jpg",
					width: 1200,
					height: 630,
					alt: "LikeCard متجر إلكتروني",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: "LikeCard | أكبر منصة بطاقات شحن رقمية",
			description: "أكبر منصة بطاقات شحن رقمية",
			images: ["/og-image.jpg"],
		},
		icons: {
			icon: "/favicon.ico",
			shortcut: "/favicon-16x16.png",
			apple: "/apple-touch-icon.png",
		},
	};
}

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="ar" dir="rtl" className={cairo.className}>
			<body className="bg-white">
				<LanguageProvider>
					<AuthProvider>
						<DataProvider>
							<AppProvider>
								<ToastProvider>
									<Providers>
										<LayoutShell>{children}</LayoutShell>
										<Toaster
											position="top-center"
											containerStyle={{
												zIndex: 99999999,
											}}
										/>
									</Providers>
								</ToastProvider>
							</AppProvider>
						</DataProvider>
					</AuthProvider>
				</LanguageProvider>
			</body>
		</html>
	);
}