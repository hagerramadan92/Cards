'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

const fallbackImage = '/images/placeholder.webp';

export default function ImageWithFallback(props: ImageProps) {
    const { src, alt, priority, loading, ...rest } = props;
    const [imgSrc, setImgSrc] = useState(src || fallbackImage);

    useEffect(() => {
        setImgSrc(src || fallbackImage);
    }, [src]);

    return (
        <Image
            {...rest}
            src={imgSrc}
            alt={alt || "صورة"}
            priority={priority}
            loading={priority ? undefined : (loading || "lazy")}
            decoding={priority ? "sync" : "async"}
            onError={() => {
                setImgSrc(fallbackImage);
            }}
        />
    );
}

