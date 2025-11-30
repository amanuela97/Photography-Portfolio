"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
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
  const prevSrcRef = useRef<string>(src);

  // Reset state when src changes (using separate effect to avoid linting error)
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      // Use setTimeout to defer state updates
      const timeoutId = setTimeout(() => {
        setIsLoaded(false);
        setIsVisible(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [src]);

  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (!isCancelled) {
        setIsVisible(true);
      }
    }, 50);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [src]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        key={src}
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
        onError={() => {
          // Still show image even on error to prevent blank space
          setIsLoaded(true);
        }}
      />
    </div>
  );
}
