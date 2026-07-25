'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

const fallbackImage = '/images/placeholder.webp';

export default function ImageWithFallback(props: ImageProps) {
    const { src, alt, priority, loading, ...rest } = props;
    const requestedSrc = src || fallbackImage;
    const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
    const useFallback = failedSrc === requestedSrc;
    const imgSrc = useFallback ? fallbackImage : requestedSrc;

    return (
        <Image
            {...rest}
            src={imgSrc}
            alt={alt || "صورة"}
            priority={priority}
            loading={priority ? undefined : (loading || "lazy")}
            decoding={priority ? "sync" : "async"}
            onError={
                useFallback
                    ? undefined
                    : () => {
                        setFailedSrc(requestedSrc);
                    }
            }
        />
    );
}
