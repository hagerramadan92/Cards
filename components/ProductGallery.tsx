"use client";

import { useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ImagesI } from "@/Types/ProductsI";

// دالة مساعدة للتحقق من صحة الصورة
const getValidImageUrl = (imagePath: string | null | undefined, fallback: string = "/images/placeholder.svg"): string => {
  if (!imagePath) return fallback;
  if (imagePath === "/images/not.jpg") return fallback;
  if (imagePath.includes("default.png")) return fallback;
  return imagePath;
};

export default function ProductGallery({ mainImage, images }: any) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const allImages = useMemo(
    () => [{ path: mainImage, alt: "Main Product" }, ...(images || [])].filter(Boolean),
    [mainImage, images]
  );
 
  const hasNav = allImages.length > 1;

  // دالة للتحقق إذا كانت الصورة فشلت
  const hasImageFailed = (path: string) => failedImages.has(path);

  // هندلر فشل تحميل الصورة
  const handleImageError = (imagePath: string, event: any) => {
    setFailedImages(prev => new Set(prev).add(imagePath));
    // استبدال الصورة بالـ fallback
    event.target.src = "/images/placeholder.svg";
  };

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Swiper
          modules={[Navigation, Thumbs]}
          navigation={hasNav}
          thumbs={{ swiper: thumbsSwiper }}
          spaceBetween={10}
          className="w-full"
        >
          {allImages.map((img, i) => {
            const imageUrl = getValidImageUrl(img?.path);
            const imageFailed = hasImageFailed(imageUrl);

            return (
              <SwiperSlide key={i}>
                <motion.div
                  initial={{ opacity: 0.7, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full h-[320px] sm:h-[420px] lg:h-[560px] bg-slate-50"
                >
                  {!imageFailed ? (
                    <Image
                      src={imageUrl}
                      alt={img.alt || `Product ${i + 1}`}
                      fill
                      className="object-cover"
                      priority={i === 0}
                      onError={(e) => handleImageError(imageUrl, e)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                      {/* <span className="text-6xl text-slate-400 mb-2">🖼️</span> */}
                      <span className="text-sm text-slate-500 font-medium"></span>
                      <Image
                        src="/images/not.jpg"
                        alt="Placeholder" fill />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </motion.div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Thumbs */}
      {hasNav && (
        <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-sm p-3">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={4}
            breakpoints={{
              0: { slidesPerView: 4 },
              640: { slidesPerView: 6 },
              1024: { slidesPerView: 7 },
            }}
            watchSlidesProgress
          >
            {allImages.map((img, i) => {
              const imageUrl = getValidImageUrl(img?.path);
              const imageFailed = hasImageFailed(imageUrl);

              return (
                <SwiperSlide key={i} className="cursor-pointer">
                  <div className="relative h-16 sm:h-20 rounded-2xl overflow-hidden ring-1 ring-slate-200 hover:ring-slate-300 transition bg-slate-100">
                    {!imageFailed ? (
                      <Image
                        src={imageUrl}
                        alt={img.alt || `Thumb ${i + 1}`}
                        fill
                        className="object-cover hover:scale-[1.03] transition duration-300"
                        onError={(e) => handleImageError(imageUrl, e)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl text-slate-400">🖼️</span>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}
    </div>
  );
}