"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/src/context/LanguageContext";
type Props = {
	href?: string;
	size?: number; // logo size in px
	showTagline?: boolean;
	className?: string;
};

export default function Logo({
	href = "/",
	size = 44, 
	className = "",
}: Props) {
	const { t } = useLanguage();
	return (
		<Link
		
			href={href}
			className={`inline-flex items-center gap-2 select-none ${className}`}
			aria-label=" كارد"
		>
			{/* Logo */}
			<motion.div
				initial={{ opacity: 0, y: 8, scale: 0.96 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.45, ease: "easeOut" }}
				className="relative"
			>
				{/* Size via wrapper scale so Next/Image dimensions are never overridden by CSS */}
				<div className="relative w-[44px] h-[44px] max-md:scale-[0.795] max-md:origin-left">
					<Image
						src="/logo/Logo.png"
						alt="LikeCard Logo"
						width={size}
						height={size}
						className="object-contain"
						style={{ width: "auto", height: "auto" }}
						priority
					/>
				</div>
			</motion.div>

			{/* Names */}
			<div className="flex flex-col leading-tight ">
				<motion.div
					initial={{ opacity: 0, x: 10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
					className="flex flex-col "
				>
					<span className="font-ar whitespace-nowrap  font-extrabold text-slate-900 md:text-lg text-sm">
						{t("logo")}
					</span>

					<span className=" mt-[-1px] md:mt-[-3px] whitespace-nowrap font-en font-bold text-slate-500 text-[7px] md:text-xs tracking-wide text-pro-max">
						{t("logoTagline")}
					</span>
				</motion.div>
			</div>
			
		</Link>
	);
}
