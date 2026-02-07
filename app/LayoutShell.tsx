"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

// Lazy-load below-the-fold UI for faster first paint
const Footer = dynamic(() => import("@/components/Footer").then((m) => m.default), { ssr: true });
const FloatingChatButton = dynamic(
	() => import("../components/WhatsappButton").then((m) => m.default),
	{ ssr: false }
);
const QuickBuyButton = dynamic(
	() => import("../components/QuickBuyButton").then((m) => m.default),
	{ ssr: false }
);

export default function LayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	const hideLayout = ["/login", "/signup", "/login/forgetPassword", "/login/resetpassword"].includes(
		pathname
	);

	return (
		<>
 			{!hideLayout && <Navbar />}

			<div className={`${!hideLayout ? "pt-[110px] lg:pt-[190px]" : ""}   min-h-[80vh]`}>
				{children}
			</div>

				{!hideLayout && <Footer />}
				<FloatingChatButton />
			<div className="sm:hidden block">
				<QuickBuyButton />
			</div>
			
		</>
	);
}
