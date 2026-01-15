"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
	return (
		<Link
		dir="rtl"
			href={href}
			className={`inline-flex items-center gap-2 select-none ${className}`}
			aria-label="LikeCard"
		>
			

			{/* Names */}
			<div className="flex flex-col leading-tight ">
				<motion.div
					initial={{ opacity: 0, x: 10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
					className="flex flex-col items-baseline "
				>
					<span className="font-ar whitespace-nowrap  font-extrabold text-slate-900 max-md:text-base text-lg">
						LikeCard
					</span>

					<span className=" mt-[-3px] whitespace-nowrap font-en font-bold text-slate-500 text-[9px] max-md:text-xs tracking-wide text-pro-max">
						PlayMore...Payless
					</span>
				</motion.div>
			</div>
			{/* Logo */}
			<motion.div
				initial={{ opacity: 0, y: 8, scale: 0.96 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.45, ease: "easeOut" }}
				className="relative"
			>
				{/* soft glow */}
				<div className="relative  ">
					<Image
						src="/logo/Logo.png"
						alt="LikeCard Logo"
						width={size}
						height={size}
						className="object-contain max-md:w-[35px] w-[44px] "
						priority
					/>
				</div>
			</motion.div>
		</Link>
	);
}
