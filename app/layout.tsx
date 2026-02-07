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


const cairo = Cairo({
	subsets: ["arabic"],
	weight: ["300", "400", "600", "700"],
	display: "swap"
});

// Required for resolving OG/twitter image URLs. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
const metadataBaseUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
	metadataBase: metadataBaseUrl,
	title: {
		default: "أكبر منصة بطاقات شحن رقمية",
		template: "%s | LikeCard",
	}, 
	description: "أكبر منصة بطاقات شحن رقمية",
	keywords: ["أكبر منصة بطاقات شحن رقمية", "LikeCard", "", "", "",],

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
		description:
			"أكبر منصة بطاقات شحن رقمية",
		images: [
			{
				url: "/og-image.jpg", // ✨ حط صورة OG حقيقية
				width: 1200,
				height: 630,
				alt: "LikeCard متجر إلكتروني",
			},
		],
	},

	twitter: {
		card: "summary_large_image",
		title: "LikeCard | 	أكبر منصة بطاقات شحن رقمية",
		description:
			"أكبر منصة بطاقات شحن رقمية",
		images: ["/og-image.jpg"],
	},

	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},

	// manifest: "/site.webmanifest",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {

	return (
		<html lang="ar" dir="rtl" className={cairo.className}>

			<body className="bg-white">
				<LanguageProvider>
				<AuthProvider>
				<AppProvider>
					<ToastProvider>
						<Providers>
							{/* <Navbar /> */}
							<LayoutShell>{children}</LayoutShell>
							{/* <div className=" min-h-[80vh] pt-[90px] lg:pt-[140px]"></div> */}

							<Toaster
								position="top-center"
								containerStyle={{
									zIndex: 99999999,
								}}
							/>
							{/* <Footer /> */}
						</Providers>
					</ToastProvider>
				</AppProvider>
				</AuthProvider>
				</LanguageProvider>
				
			</body>
		</html>
	);
}
