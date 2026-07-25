'use client';

import Image from "@/components/ImageWithFallback";
import { useState } from "react";
import notImage from "@/public/images/placeholder.webp";

interface ImgProp {
	image: string;
	alt?: string;
	width?: number;
	height?: number;
	className?: string;
	priority?: boolean;
	sizes?: string;
}

export default function ImageComponent({ image, alt = "صورة المنتج", priority = false, sizes = "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" }: ImgProp) {
	const [imgSrc, setImgSrc] = useState(image || notImage);
	const [hasError, setHasError] = useState(false);

	if (hasError) {
		return (
			<div className="relative w-full h-full">
				<Image
					src={notImage}
					alt={alt}
					width={600}
					height={400}
					sizes={sizes}
					className="object-cover h-full w-full"
					priority={priority}
					loading={priority ? undefined : "lazy"}
					decoding={priority ? "sync" : "async"}
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
				sizes={sizes}
				className="object-cover h-full w-full"
				priority={priority}
				loading={priority ? undefined : "lazy"}
				decoding={priority ? "sync" : "async"}
				onError={() => {
					setHasError(true);
					setImgSrc(notImage);
				}}
			/>
		</div>
	);
}