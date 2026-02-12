'use client';

import Image from "next/image";
import { useState } from "react";
import notImage from "@/public/images/not.jpg"; // استيراد الصورة المحلية

interface ImgProp {
	image: string;
	alt?: string;
}

export default function ImageComponent({ image, alt = "صورة المنتج" }: ImgProp) {
	const [imgSrc, setImgSrc] = useState(image || notImage);
	const [hasError, setHasError] = useState(false);

	// إذا حدث خطأ، استخدم الصورة المحلية
	if (hasError) {
		return (
			<div className="relative w-full h-full">
				<Image
					src={notImage}
					alt={alt}
					width={600}
					height={400}
					className="object-cover h-full"
					loading="lazy"
					decoding="async"
				/>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			<Image
				src={imgSrc}
				alt={alt}
				width={600}
				height={400}
				className="object-cover h-full"
				loading="lazy"
				decoding="async"
				onError={() => {
					setHasError(true);
					setImgSrc(notImage);
				}}
			/>
		</div>
	);
}