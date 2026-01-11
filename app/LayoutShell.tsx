"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingChatButton from "../components/WhatsappButton";
import HeaderAdsSlider from "../components/HeaderAdsSlider";
import { MdDownload } from "react-icons/md";
import QuickBuyButton from "../components/QuickBuyButton";

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
			<QuickBuyButton />
			
			<MdDownload />
		</>
	);
}
