import { getImageProps } from "next/image";
import { preload } from "react-dom";

const heroSizes = "(max-width: 1392px) calc(100vw - 2rem), 1360px";

type HeroResponsiveImageProps = {
  desktopSrc: string;
  mobileSrc?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
};

export default function HeroResponsiveImage({
  desktopSrc,
  mobileSrc,
  alt,
  priority = false,
  className,
}: HeroResponsiveImageProps) {
  const hasSeparateMobileImage = Boolean(
    mobileSrc && mobileSrc !== desktopSrc,
  );
  const { props: desktopImageProps } = getImageProps({
    src: desktopSrc,
    alt,
    width: 1360,
    height: 420,
    sizes: heroSizes,
    quality: 75,
    loading: priority ? "eager" : "lazy",
    fetchPriority: priority ? "high" : "auto",
  });
  const mobileImageProps = hasSeparateMobileImage
    ? getImageProps({
        src: mobileSrc as string,
        alt,
        width: 768,
        height: 200,
        sizes: heroSizes,
        quality: 75,
        loading: priority ? "eager" : "lazy",
        fetchPriority: priority ? "high" : "auto",
      }).props
    : null;

  if (priority) {
    if (mobileImageProps) {
      preload(mobileImageProps.src, {
        as: "image",
        imageSrcSet: mobileImageProps.srcSet,
        imageSizes: heroSizes,
        fetchPriority: "high",
        media: "(max-width: 767px)",
      });
    }

    preload(desktopImageProps.src, {
      as: "image",
      imageSrcSet: desktopImageProps.srcSet,
      imageSizes: heroSizes,
      fetchPriority: "high",
      media: mobileImageProps ? "(min-width: 768px)" : undefined,
    });
  }

  return (
    <picture className="absolute inset-0 block h-full w-full">
      {mobileImageProps && (
        <source
          media="(max-width: 767px)"
          srcSet={mobileImageProps.srcSet}
          sizes={heroSizes}
        />
      )}
      <img
        {...desktopImageProps}
        alt={alt}
        decoding={priority ? "sync" : "async"}
        className={className}
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") return;

          event.currentTarget.dataset.fallbackApplied = "true";
          const picture = event.currentTarget.parentElement;
          picture
            ?.querySelectorAll("source")
            .forEach((source) => source.removeAttribute("srcset"));
          event.currentTarget.srcset = "";
          event.currentTarget.src = "/images/placeholder.webp";
        }}
      />
    </picture>
  );
}
