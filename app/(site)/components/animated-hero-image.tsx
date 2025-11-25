"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { WARM_BLUR_DATA_URL } from "@/utils/image-placeholders";
import { isSignedUrl } from "@/utils/cache-buster";

interface AnimatedHeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  blurDataURL?: string | null;
}

export function AnimatedHeroImage({
  src,
  alt,
  priority = false,
  className = "",
  blurDataURL,
}: AnimatedHeroImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const resetState = () => {
      if (isCancelled) {
        return;
      }
      setIsLoaded(false);
      setIsVisible(false);
    };

    const raf = requestAnimationFrame(resetState);
    const timer = setTimeout(() => {
      if (!isCancelled) {
        setIsVisible(true);
      }
    }, 50);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [src]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        className={`object-cover transition-opacity duration-1000 ease-in-out ${
          isLoaded && isVisible ? "opacity-100" : "opacity-0"
        }`}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL={blurDataURL ?? WARM_BLUR_DATA_URL}
        unoptimized={isSignedUrl(src)}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
